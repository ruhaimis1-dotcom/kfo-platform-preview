-- Applied migration: intelligent course engine. Supabase version 20261007165647.
-- Review-only intelligent course engine proposal. No Deploy Until MVP Gate.
create table if not exists public.course_skills (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 skill_code text not null, title text not null, outcome text not null, unique(course_slug,course_version,skill_code)
);
create table if not exists public.course_activities (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 activity_key text not null, activity_type text not null check(activity_type in ('content','quick_check','scenario','ordering','error_spotting','reflection','practical_task','file_evidence','simulation','assessment')),
 title text not null, sequence_no integer not null check(sequence_no>0), required boolean not null default true,
 config jsonb not null default '{}'::jsonb, unique(course_slug,course_version,activity_key)
);
create table if not exists public.course_activity_skills (
 activity_id uuid not null references public.course_activities(id) on delete cascade,
 skill_id uuid not null references public.course_skills(id) on delete cascade,
 weight numeric(6,3) not null default 1 check(weight>0), primary key(activity_id,skill_id)
);
create table if not exists public.course_rubrics (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 rubric_key text not null, title text not null, criteria jsonb not null, unique(course_slug,course_version,rubric_key)
);
create table if not exists public.learning_evidence (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 activity_id uuid not null references public.course_activities(id), user_id uuid not null references auth.users(id) on delete cascade,
 evidence_type text not null check(evidence_type in ('text','structured','file','observation')),
 payload jsonb not null default '{}'::jsonb, submitted_at timestamptz not null default now(),
 review_status text not null default 'pending' check(review_status in ('pending','passed','needs_revision','failed'))
);
create table if not exists public.evidence_reviews (
 id uuid primary key default gen_random_uuid(), evidence_id uuid not null references public.learning_evidence(id) on delete cascade,
 rubric_id uuid references public.course_rubrics(id), reviewer_type text not null check(reviewer_type in ('human','deterministic','ai_assist')),
 reviewer_user_id uuid references auth.users(id), score numeric(6,2), feedback text, created_at timestamptz not null default now(),
 check(reviewer_type<>'human' or reviewer_user_id is not null)
);
create table if not exists public.skill_measurements (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 skill_id uuid not null references public.course_skills(id), user_id uuid not null references auth.users(id) on delete cascade,
 stage text not null check(stage in ('pre','during','post','followup')), score numeric(6,2) check(score between 0 and 100),
 measured_at timestamptz not null default now(), source text not null
);
create table if not exists public.impact_checkpoints (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, checkpoint_days integer not null check(checkpoint_days in (30,60,90)),
 due_at timestamptz not null, completed_at timestamptz, learner_score numeric(6,2), manager_score numeric(6,2), notes text,
 unique(enrollment_id,checkpoint_days)
);
alter table public.learning_evidence enable row level security; alter table public.evidence_reviews enable row level security;
alter table public.skill_measurements enable row level security; alter table public.impact_checkpoints enable row level security;
create policy learner_reads_own_evidence on public.learning_evidence for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_measurements on public.skill_measurements for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_impact on public.impact_checkpoints for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.learning_evidence from authenticated;
revoke insert,update,delete on public.evidence_reviews from authenticated;
revoke insert,update,delete on public.skill_measurements from authenticated;
revoke insert,update,delete on public.impact_checkpoints from authenticated;


-- Learner evidence submission is RPC-only and bound to owned active enrollment + exact course activity.
create or replace function public.submit_my_learning_evidence(p_enrollment_id uuid,p_activity_id uuid,p_evidence_type text,p_payload jsonb)
returns public.learning_evidence language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_e public.learning_enrollments%rowtype; v_a public.course_activities%rowtype; v_row public.learning_evidence;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select * into v_e from public.learning_enrollments where id=p_enrollment_id and user_id=v_uid and status='active';
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 select * into v_a from public.course_activities where id=p_activity_id and course_slug=v_e.course_slug and course_version=v_e.course_version;
 if not found or v_a.activity_type not in ('reflection','practical_task','file_evidence') then raise exception 'activity unavailable' using errcode='42501'; end if;
 if p_evidence_type not in ('text','structured','file') or p_payload is null or p_payload='{}'::jsonb then raise exception 'invalid evidence' using errcode='22023'; end if;
 insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload,review_status)
 values(v_e.id,v_a.id,v_uid,p_evidence_type,p_payload,'pending') returning * into v_row;
 return v_row;
end $$;
revoke all on function public.submit_my_learning_evidence(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.submit_my_learning_evidence(uuid,uuid,text,jsonb) to authenticated;

-- Human/deterministic review result is applied through a private helper; AI assist cannot finalize evidence.
create or replace function private.finalize_evidence_review(p_evidence_id uuid,p_rubric_id uuid,p_reviewer_type text,p_reviewer_user_id uuid,p_score numeric,p_feedback text,p_status text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_review uuid;
begin
 if p_reviewer_type not in ('human','deterministic') then raise exception 'AI assist cannot finalize evidence' using errcode='42501'; end if;
 if p_status not in ('passed','needs_revision','failed') or p_score<0 or p_score>100 then raise exception 'invalid review' using errcode='22023'; end if;
 if p_reviewer_type='human' and p_reviewer_user_id is null then raise exception 'human reviewer required' using errcode='22023'; end if;
 insert into public.evidence_reviews(evidence_id,rubric_id,reviewer_type,reviewer_user_id,score,feedback)
 values(p_evidence_id,p_rubric_id,p_reviewer_type,p_reviewer_user_id,p_score,p_feedback) returning id into v_review;
 update public.learning_evidence set review_status=p_status where id=p_evidence_id;
 return v_review;
end $$;
revoke all on function private.finalize_evidence_review(uuid,uuid,text,uuid,numeric,text,text) from public,anon,authenticated;

-- Human review entry point. SA may review any evidence; CO/BM are restricted to organization learning in their own scope.
create or replace function public.review_learning_evidence(p_evidence_id uuid,p_rubric_id uuid,p_score numeric,p_feedback text,p_status text)
returns public.learning_evidence language plpgsql security definer set search_path to '' as $review$
declare
 v_uid uuid:=auth.uid(); v_ev public.learning_evidence%rowtype; v_en public.learning_enrollments%rowtype;
 v_learner_membership public.organization_memberships%rowtype; v_allowed boolean:=false; v_review uuid;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 if p_status not in ('passed','needs_revision','failed') or p_score<0 or p_score>100
 then raise exception 'invalid review' using errcode='22023'; end if;

 select * into v_ev from public.learning_evidence where id=p_evidence_id for update;
 if not found then raise exception 'evidence unavailable' using errcode='42501'; end if;
 select * into v_en from public.learning_enrollments where id=v_ev.enrollment_id;
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;

 -- Platform admin role can review personal or organization evidence.
 select exists(
   select 1 from public.organization_memberships rm
   join public.membership_roles rr on rr.membership_id=rm.id and rr.organization_id=rm.organization_id
   where rm.user_id=v_uid and rm.status='active' and rr.role_code='SA'
 ) into v_allowed;

 if not v_allowed and v_en.context_type='organization' then
   select * into v_learner_membership
   from public.organization_memberships
   where id=v_en.membership_id and organization_id=v_en.organization_id and user_id=v_en.user_id;

   if found then
     select exists(
       select 1
       from public.organization_memberships rm
       join public.membership_roles rr on rr.membership_id=rm.id and rr.organization_id=rm.organization_id
       where rm.user_id=v_uid and rm.status='active' and rm.organization_id=v_en.organization_id
         and (
           rr.role_code='CO'
           or (
             rr.role_code='BM'
             and (coalesce(rm.branch_id,rr.branch_id) is null or coalesce(rm.branch_id,rr.branch_id)=v_learner_membership.branch_id)
             and (coalesce(rm.department_id,rr.department_id) is null or coalesce(rm.department_id,rr.department_id)=v_learner_membership.department_id)
           )
         )
     ) into v_allowed;
   end if;
 end if;

 if not v_allowed then raise exception 'review unavailable' using errcode='42501'; end if;

 if p_rubric_id is not null and not exists(
   select 1 from public.course_rubrics r
   where r.id=p_rubric_id and r.course_slug=v_en.course_slug and r.course_version=v_en.course_version
 ) then raise exception 'rubric unavailable' using errcode='22023'; end if;

 v_review:=private.finalize_evidence_review(p_evidence_id,p_rubric_id,'human',v_uid,p_score,p_feedback,p_status);
 select * into v_ev from public.learning_evidence where id=p_evidence_id;
 return v_ev;
end $review$;
revoke all on function public.review_learning_evidence(uuid,uuid,numeric,text,text) from public,anon;
grant execute on function public.review_learning_evidence(uuid,uuid,numeric,text,text) to authenticated;

create or replace function private.record_skill_measurement(p_enrollment_id uuid,p_skill_id uuid,p_stage text,p_score numeric,p_source text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_user uuid; v_id uuid;
begin
 select user_id into v_user from public.learning_enrollments where id=p_enrollment_id;
 if v_user is null or p_stage not in ('pre','during','post','followup') or p_score<0 or p_score>100 then raise exception 'invalid measurement' using errcode='22023'; end if;
 insert into public.skill_measurements(enrollment_id,skill_id,user_id,stage,score,source)
 values(p_enrollment_id,p_skill_id,v_user,p_stage,p_score,p_source) returning id into v_id; return v_id;
end $$;
revoke all on function private.record_skill_measurement(uuid,uuid,text,numeric,text) from public,anon,authenticated;


-- Private evidence files. Bucket creation/configuration remains an MVP Gate operation.
-- Object path contract: <user_id>/<enrollment_id>/<activity_id>/<uuid>.<safe-ext>
create table if not exists public.evidence_files (
 id uuid primary key default gen_random_uuid(), evidence_id uuid not null references public.learning_evidence(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, bucket_id text not null default 'kfo-learning-evidence',
 object_path text not null unique, original_name text not null, mime_type text not null, size_bytes bigint not null check(size_bytes>0),
 created_at timestamptz not null default now()
);
alter table public.evidence_files enable row level security;
create policy learner_reads_own_evidence_files on public.evidence_files for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.evidence_files from authenticated;

create or replace function public.prepare_my_evidence_upload(p_enrollment_id uuid,p_activity_id uuid,p_original_name text,p_mime_type text,p_size_bytes bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_e public.learning_enrollments%rowtype; v_a public.course_activities%rowtype; v_ext text; v_object text;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select * into v_e from public.learning_enrollments where id=p_enrollment_id and user_id=v_uid and status='active';
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 select * into v_a from public.course_activities where id=p_activity_id and course_slug=v_e.course_slug and course_version=v_e.course_version and activity_type='file_evidence';
 if not found then raise exception 'file activity unavailable' using errcode='42501'; end if;
 if p_size_bytes<=0 or p_size_bytes>10485760 then raise exception 'file too large' using errcode='22023'; end if;
 if p_mime_type not in ('application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/png','image/jpeg') then raise exception 'file type unavailable' using errcode='22023'; end if;
 v_ext:=case p_mime_type when 'application/pdf' then 'pdf' when 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' then 'xlsx' when 'text/csv' then 'csv' when 'image/png' then 'png' else 'jpg' end;
 v_object:=v_uid::text||'/'||v_e.id::text||'/'||v_a.id::text||'/'||gen_random_uuid()::text||'.'||v_ext;
 return jsonb_build_object('bucket','kfo-learning-evidence','object_path',v_object,'max_bytes',10485760);
end $$;
revoke all on function public.prepare_my_evidence_upload(uuid,uuid,text,text,bigint) from public,anon;
grant execute on function public.prepare_my_evidence_upload(uuid,uuid,text,text,bigint) to authenticated;

create or replace function public.finalize_my_file_evidence(p_enrollment_id uuid,p_activity_id uuid,p_object_path text,p_original_name text,p_mime_type text,p_size_bytes bigint)
returns public.learning_evidence language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_prefix text; v_ev public.learning_evidence;
begin
 v_prefix:=v_uid::text||'/'||p_enrollment_id::text||'/'||p_activity_id::text||'/';
 if v_uid is null or position(v_prefix in p_object_path)<>1 then raise exception 'invalid object path' using errcode='42501'; end if;
 v_ev:=public.submit_my_learning_evidence(p_enrollment_id,p_activity_id,'file',jsonb_build_object('storage','private'));
 insert into public.evidence_files(evidence_id,user_id,object_path,original_name,mime_type,size_bytes)
 values(v_ev.id,v_uid,p_object_path,p_original_name,p_mime_type,p_size_bytes);
 return v_ev;
end $$;
revoke all on function public.finalize_my_file_evidence(uuid,uuid,text,text,text,bigint) from public,anon;
grant execute on function public.finalize_my_file_evidence(uuid,uuid,text,text,text,bigint) to authenticated;


-- Finalization must verify the private Storage object server-side before evidence exists.
-- This helper expects the bucket/object to be present in storage.objects and validates owner path + metadata.
create or replace function public.finalize_verified_file_evidence(p_enrollment_id uuid,p_activity_id uuid,p_object_path text,p_original_name text,p_expected_mime text,p_expected_size bigint)
returns public.learning_evidence language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_prefix text; v_obj record; v_ev public.learning_evidence;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 v_prefix:=v_uid::text||'/'||p_enrollment_id::text||'/'||p_activity_id::text||'/';
 if position(v_prefix in p_object_path)<>1 then raise exception 'invalid object path' using errcode='42501'; end if;
 select o.name,o.metadata into v_obj from storage.objects o where o.bucket_id='kfo-learning-evidence' and o.name=p_object_path limit 1;
 if not found then raise exception 'uploaded object unavailable' using errcode='22023'; end if;
 if coalesce((v_obj.metadata->>'size')::bigint,-1)<>p_expected_size or coalesce(v_obj.metadata->>'mimetype','')<>p_expected_mime
 then raise exception 'uploaded object metadata mismatch' using errcode='22023'; end if;
 v_ev:=public.submit_my_learning_evidence(p_enrollment_id,p_activity_id,'file',jsonb_build_object('storage','private'));
 insert into public.evidence_files(evidence_id,user_id,object_path,original_name,mime_type,size_bytes)
 values(v_ev.id,v_uid,p_object_path,p_original_name,p_expected_mime,p_expected_size);
 return v_ev;
end $$;
revoke all on function public.finalize_verified_file_evidence(uuid,uuid,text,text,text,bigint) from public,anon;
grant execute on function public.finalize_verified_file_evidence(uuid,uuid,text,text,text,bigint) to authenticated;

-- Skill measurement summary for the learner; raw evidence/reviewer details remain separate.
create or replace function public.my_skill_measurements(p_enrollment_id uuid)
returns table(skill_code text,skill_title text,stage text,score numeric,measured_at timestamptz)
language sql stable security invoker set search_path to '' as $$
 select s.skill_code,s.title,m.stage,m.score,m.measured_at
 from public.skill_measurements m join public.course_skills s on s.id=m.skill_id
 join public.learning_enrollments e on e.id=m.enrollment_id
 where m.enrollment_id=p_enrollment_id and m.user_id=auth.uid() and e.user_id=auth.uid()
 order by s.skill_code,m.measured_at;
$$;
revoke all on function public.my_skill_measurements(uuid) from public,anon;
grant execute on function public.my_skill_measurements(uuid) to authenticated;


-- Assessment question-to-skill map allows post scores per skill instead of one aggregate score.
create table if not exists private.assessment_question_skills (
 course_slug text not null, course_version integer not null, question_id text not null,
 skill_id uuid not null references public.course_skills(id) on delete cascade,
 primary key(course_slug,course_version,question_id,skill_id)
);
revoke all on private.assessment_question_skills from public,anon,authenticated;

create or replace function private.record_post_skill_scores(p_enrollment_id uuid,p_question_ids text[],p_answers integer[],p_correct_answers integer[])
returns void language plpgsql security definer set search_path to '' as $$
declare v_e public.learning_enrollments%rowtype; r record;
begin
 select * into v_e from public.learning_enrollments where id=p_enrollment_id;
 if not found or cardinality(p_question_ids)<>cardinality(p_answers) or cardinality(p_answers)<>cardinality(p_correct_answers) then raise exception 'invalid post measurement' using errcode='22023'; end if;
 for r in
  select m.skill_id,100.0*count(*) filter(where q.answer=q.correct)/count(*) as score
  from unnest(p_question_ids,p_answers,p_correct_answers) q(question_id,answer,correct)
  join private.assessment_question_skills m on m.course_slug=v_e.course_slug and m.course_version=v_e.course_version and m.question_id=q.question_id
  group by m.skill_id
 loop
  perform private.record_skill_measurement(p_enrollment_id,r.skill_id,'post',r.score,'official_assessment');
 end loop;
end $$;
revoke all on function private.record_post_skill_scores(uuid,text[],integer[],integer[]) from public,anon,authenticated;
