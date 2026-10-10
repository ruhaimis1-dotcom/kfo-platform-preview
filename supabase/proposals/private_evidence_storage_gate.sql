-- KFO private evidence gate. No deployment; scoped storage permissions only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kfo-learning-evidence','kfo-learning-evidence',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function private.can_review_learning_enrollment(p_enrollment_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.learning_enrollments en
 where en.id=p_enrollment_id and (
  private.is_platform_admin() or (
   en.context_type='organization' and exists(
    select 1 from public.organization_memberships learner
    join public.organization_memberships reviewer on reviewer.organization_id=learner.organization_id
    join public.membership_roles rr on rr.membership_id=reviewer.id and rr.organization_id=reviewer.organization_id
    where learner.id=en.membership_id and learner.user_id=en.user_id and learner.organization_id=en.organization_id and learner.status='active'
     and reviewer.user_id=auth.uid() and reviewer.status='active'
     and (rr.role_code='CO' or (rr.role_code='BM'
      and (coalesce(reviewer.branch_id,rr.branch_id) is null or coalesce(reviewer.branch_id,rr.branch_id)=learner.branch_id)
      and (coalesce(reviewer.department_id,rr.department_id) is null or coalesce(reviewer.department_id,rr.department_id)=learner.department_id)))
   )
  )
 ));
$$;

create or replace function private.evidence_upload_allowed(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and split_part(p_name,'/',1)=auth.uid()::text
 and array_length(string_to_array(p_name,'/'),1)=4
 and split_part(p_name,'/',4) ~ '^[0-9a-f-]{36}\.(pdf|xlsx|csv|png|jpg)$'
 and exists(select 1 from public.learning_enrollments en join public.course_activities a
  on a.course_slug=en.course_slug and a.course_version=en.course_version
  where en.id=private.try_uuid(split_part(p_name,'/',2)) and en.user_id=auth.uid() and en.status='active'
   and a.id=private.try_uuid(split_part(p_name,'/',3)) and a.activity_type='file_evidence'
   and (en.context_type='personal' or exists(select 1 from public.organization_memberships m
    where m.id=en.membership_id and m.organization_id=en.organization_id and m.user_id=en.user_id and m.status='active')));
$$;

create or replace function private.evidence_read_allowed(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
  (split_part(p_name,'/',1)=auth.uid()::text and exists(select 1 from public.learning_enrollments en
   where en.id=private.try_uuid(split_part(p_name,'/',2)) and en.user_id=auth.uid()))
  or exists(select 1 from public.evidence_files f join public.learning_evidence ev on ev.id=f.evidence_id
   where f.object_path=p_name and private.can_review_learning_enrollment(ev.enrollment_id))
 );
$$;
revoke all on function private.can_review_learning_enrollment(uuid),private.evidence_upload_allowed(text),private.evidence_read_allowed(text) from public,anon;
grant execute on function private.can_review_learning_enrollment(uuid),private.evidence_upload_allowed(text),private.evidence_read_allowed(text) to authenticated;

create policy kfo_evidence_insert on storage.objects for insert to authenticated
 with check(bucket_id='kfo-learning-evidence' and private.evidence_upload_allowed(name));
create policy kfo_evidence_read on storage.objects for select to authenticated
 using(bucket_id='kfo-learning-evidence' and private.evidence_read_allowed(name));
-- Submitted evidence is immutable; only own unfinalized uploads can be removed.
create policy kfo_evidence_delete_unsubmitted on storage.objects for delete to authenticated
 using(bucket_id='kfo-learning-evidence' and private.evidence_upload_allowed(name)
 and not exists(select 1 from public.evidence_files f where f.object_path=objects.name));

create or replace function public.prepare_my_evidence_upload(p_enrollment_id uuid,p_activity_id uuid,p_original_name text,p_mime_type text,p_size_bytes bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_ext text; v_path text;
begin
 if p_size_bytes is null or p_size_bytes<=0 or p_size_bytes>10485760 or p_original_name is null or length(trim(p_original_name)) not between 1 and 255 then raise exception 'invalid file' using errcode='22023'; end if;
 v_ext:=case p_mime_type when 'application/pdf' then 'pdf' when 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' then 'xlsx' when 'text/csv' then 'csv' when 'image/png' then 'png' when 'image/jpeg' then 'jpg' else null end;
 if v_ext is null then raise exception 'file type unavailable' using errcode='22023'; end if;
 v_path:=auth.uid()::text||'/'||p_enrollment_id::text||'/'||p_activity_id::text||'/'||gen_random_uuid()::text||'.'||v_ext;
 if not coalesce(private.evidence_upload_allowed(v_path),false) then raise exception 'file activity unavailable' using errcode='42501'; end if;
 return jsonb_build_object('bucket','kfo-learning-evidence','object_path',v_path,'max_bytes',10485760);
end $$;

create or replace function public.finalize_verified_file_evidence(p_enrollment_id uuid,p_activity_id uuid,p_object_path text,p_original_name text,p_expected_mime text,p_expected_size bigint)
returns public.learning_evidence language plpgsql security definer set search_path='' as $$
declare v_obj record; v_ev public.learning_evidence; v_size bigint; v_mime text; v_ext text;
begin
 if p_object_path is null or not coalesce(private.evidence_upload_allowed(p_object_path),false)
  or private.try_uuid(split_part(p_object_path,'/',2)) is distinct from p_enrollment_id
  or private.try_uuid(split_part(p_object_path,'/',3)) is distinct from p_activity_id
 then raise exception 'invalid object path' using errcode='42501'; end if;
 -- Serialize retries for the same object, then reuse the existing submission.
 perform pg_advisory_xact_lock(hashtextextended(p_object_path,0));
 select ev.* into v_ev from public.evidence_files f join public.learning_evidence ev on ev.id=f.evidence_id where f.object_path=p_object_path and f.user_id=auth.uid();
 if found then return v_ev; end if;
 select metadata into v_obj from storage.objects where bucket_id='kfo-learning-evidence' and name=p_object_path;
 if not found then raise exception 'uploaded object unavailable' using errcode='22023'; end if;
 v_size:=(v_obj.metadata->>'size')::bigint; v_mime:=v_obj.metadata->>'mimetype';
 v_ext:=case v_mime when 'application/pdf' then 'pdf' when 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' then 'xlsx' when 'text/csv' then 'csv' when 'image/png' then 'png' when 'image/jpeg' then 'jpg' else null end;
 if v_size is null or v_size<=0 or v_size>10485760 or v_ext is null
  or split_part(split_part(p_object_path,'/',4),'.',2)<>v_ext
  or v_size is distinct from p_expected_size or v_mime is distinct from p_expected_mime
  or p_original_name is null or length(trim(p_original_name)) not between 1 and 255
 then raise exception 'uploaded object metadata mismatch' using errcode='22023'; end if;
 insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload,review_status)
 values(p_enrollment_id,p_activity_id,auth.uid(),'file','{"storage":"private"}','pending') returning * into v_ev;
 insert into public.evidence_files(evidence_id,user_id,object_path,original_name,mime_type,size_bytes)
 values(v_ev.id,auth.uid(),p_object_path,p_original_name,v_mime,v_size);
 return v_ev;
end $$;

-- The legacy entry point must use the same verified path.
create or replace function public.finalize_my_file_evidence(p_enrollment_id uuid,p_activity_id uuid,p_object_path text,p_original_name text,p_mime_type text,p_size_bytes bigint)
returns public.learning_evidence language sql security invoker set search_path='' as $$
 select public.finalize_verified_file_evidence(p_enrollment_id,p_activity_id,p_object_path,p_original_name,p_mime_type,p_size_bytes);
$$;

create or replace function public.submit_my_learning_evidence(p_enrollment_id uuid,p_activity_id uuid,p_evidence_type text,p_payload jsonb)
returns public.learning_evidence language plpgsql security definer set search_path='' as $$
declare v_e public.learning_enrollments; v_a public.course_activities; v_row public.learning_evidence;
begin
 if auth.uid() is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select * into v_e from public.learning_enrollments where id=p_enrollment_id and user_id=auth.uid() and status='active';
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 if v_e.context_type='organization' and not exists(select 1 from public.organization_memberships m where m.id=v_e.membership_id and m.organization_id=v_e.organization_id and m.user_id=v_e.user_id and m.status='active') then raise exception 'membership unavailable' using errcode='42501'; end if;
 select * into v_a from public.course_activities where id=p_activity_id and course_slug=v_e.course_slug and course_version=v_e.course_version;
 if not found or v_a.activity_type not in ('reflection','practical_task') then raise exception 'activity unavailable' using errcode='42501'; end if;
 if p_evidence_type is null or (v_a.activity_type='reflection' and p_evidence_type<>'text') or (v_a.activity_type='practical_task' and p_evidence_type<>'structured') or p_payload is null or p_payload='{}'::jsonb then raise exception 'invalid evidence' using errcode='22023'; end if;
 insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload,review_status)
 values(v_e.id,v_a.id,auth.uid(),p_evidence_type,p_payload,'pending') returning * into v_row;
 return v_row;
end $$;

create or replace function public.learning_evidence_file(p_evidence_id uuid)
returns table(object_path text,original_name text,mime_type text,size_bytes bigint)
language sql stable security definer set search_path='' as $$
 select f.object_path,f.original_name,f.mime_type,f.size_bytes
 from public.evidence_files f join public.learning_evidence ev on ev.id=f.evidence_id
 where ev.id=p_evidence_id and auth.uid() is not null and (ev.user_id=auth.uid() or private.can_review_learning_enrollment(ev.enrollment_id));
$$;
revoke all on function public.learning_evidence_file(uuid) from public,anon;
grant execute on function public.learning_evidence_file(uuid) to authenticated;
revoke all on function public.prepare_my_evidence_upload(uuid,uuid,text,text,bigint),public.finalize_verified_file_evidence(uuid,uuid,text,text,text,bigint),public.finalize_my_file_evidence(uuid,uuid,text,text,text,bigint),public.submit_my_learning_evidence(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.prepare_my_evidence_upload(uuid,uuid,text,text,bigint),public.finalize_verified_file_evidence(uuid,uuid,text,text,text,bigint),public.finalize_my_file_evidence(uuid,uuid,text,text,text,bigint),public.submit_my_learning_evidence(uuid,uuid,text,jsonb) to authenticated;
