-- Draft-only lesson authoring. Learner runtime and assessment answers remain separate.
alter table private.course_authoring add column lesson_draft jsonb not null default '[]'::jsonb;
alter table private.course_authoring add column lesson_revision integer not null default 0;
create function private.admin_course_lesson_draft(p_slug text,p_version integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a private.course_authoring%rowtype;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 return jsonb_build_object('course_slug',a.course_slug,'course_version',a.course_version,'revision',a.lesson_revision,'activities',a.lesson_draft);
end $$;
create function private.admin_save_course_lessons(p_slug text,p_version integer,p_activities jsonb,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.course_authoring%rowtype;x jsonb;opt jsonb;seen text[]:='{}';k text;t text;v_index integer;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 if p_activities is null or jsonb_typeof(p_activities)<>'array' or jsonb_array_length(p_activities)>60 or octet_length(p_activities::text)>250000 or p_expected_revision is null or p_expected_revision<0 then raise exception 'invalid lesson draft' using errcode='22023';end if;
 for x in select value from jsonb_array_elements(p_activities) loop
  if jsonb_typeof(x)<>'object' or exists(select 1 from jsonb_object_keys(x) f where f not in ('key','type','title','body','prompt','options','correctIndex')) then raise exception 'invalid activity fields' using errcode='22023';end if;
  k:=x->>'key';t:=x->>'type';
  if jsonb_typeof(x->'key') is distinct from 'string' or k !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(k)>80 or k=any(seen) or t is null or t not in ('content','reflection','practical_task','scenario') or jsonb_typeof(x->'title') is distinct from 'string' or char_length(btrim(x->>'title')) not between 2 and 160 or (x->>'title') ~ '[[:cntrl:]]' then raise exception 'invalid activity' using errcode='22023';end if;
  seen:=array_append(seen,k);
  if t='content' then
   if jsonb_typeof(x->'body') is distinct from 'string' or char_length(btrim(x->>'body')) not between 1 and 12000 or x ?| array['prompt','options','correctIndex'] then raise exception 'invalid lesson body' using errcode='22023';end if;
  else
   if jsonb_typeof(x->'prompt') is distinct from 'string' or char_length(btrim(x->>'prompt')) not between 1 and 4000 or x ? 'body' then raise exception 'invalid prompt' using errcode='22023';end if;
   if t='scenario' then
    if jsonb_typeof(x->'options') is distinct from 'array' or jsonb_array_length(x->'options') not between 2 and 6 or jsonb_typeof(x->'correctIndex') is distinct from 'number' or (x->>'correctIndex') !~ '^[0-5]$' then raise exception 'invalid question' using errcode='22023';end if;
    v_index:=(x->>'correctIndex')::integer;
    if v_index>=jsonb_array_length(x->'options') then raise exception 'invalid answer' using errcode='22023';end if;
    for opt in select value from jsonb_array_elements(x->'options') loop
     if jsonb_typeof(opt)<>'string' or char_length(btrim(opt#>>'{}')) not between 1 and 500 then raise exception 'invalid option' using errcode='22023';end if;
    end loop;
   elsif x ?| array['options','correctIndex'] then raise exception 'unexpected answer' using errcode='22023';end if;
  end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 if a.lesson_revision<>p_expected_revision then raise exception 'lesson draft changed' using errcode='40001';end if;
 update private.course_authoring set lesson_draft=p_activities,lesson_revision=lesson_revision+1,updated_at=now() where course_slug=p_slug and course_version=p_version;
 insert into private.course_authoring_events(actor_id,course_slug,course_version,after_state) values(auth.uid(),p_slug,p_version,jsonb_build_object('kind','lesson_draft','revision',a.lesson_revision+1,'activities',p_activities));
 return private.admin_course_lesson_draft(p_slug,p_version);
end $$;
revoke all on function private.admin_course_lesson_draft(text,integer),private.admin_save_course_lessons(text,integer,jsonb,integer) from public,anon,authenticated;
grant execute on function private.admin_course_lesson_draft(text,integer),private.admin_save_course_lessons(text,integer,jsonb,integer) to authenticated;
create function public.admin_course_lesson_draft(p_slug text,p_version integer) returns jsonb language sql stable security invoker set search_path='' as $$select private.admin_course_lesson_draft(p_slug,p_version);$$;
create function public.admin_save_course_lessons(p_slug text,p_version integer,p_activities jsonb,p_expected_revision integer) returns jsonb language sql security invoker set search_path='' as $$select private.admin_save_course_lessons(p_slug,p_version,p_activities,p_expected_revision);$$;
revoke all on function public.admin_course_lesson_draft(text,integer),public.admin_save_course_lessons(text,integer,jsonb,integer) from public,anon,authenticated;
grant execute on function public.admin_course_lesson_draft(text,integer),public.admin_save_course_lessons(text,integer,jsonb,integer) to authenticated;
