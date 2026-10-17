-- Real database test. Every activation and fixture is rolled back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
do $$begin begin perform private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);raise exception 'learner activation accepted';exception when insufficient_privilege then null;end;end$$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
do $$begin
 begin perform private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',0,1);raise exception 'stale release accepted';exception when serialization_failure then null;end;
 if exists(select 1 from private.course_runtime_bindings) then raise exception 'failed activation wrote binding';end if;
end$$;
select private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);
select private.activate_course_release('a89992df-c64e-445b-b72e-48ab92ad4a84',1,1);
do $$declare r record;n integer;begin
 for r in select * from private.course_release_snapshots where id in ('9258a28c-c395-433d-8b30-c249e50cb4b7','a89992df-c64e-445b-b72e-48ab92ad4a84') loop
  select count(*) into n from public.course_activities where course_slug=r.course_slug and course_version=r.course_version;
  if n<>jsonb_array_length(r.runtime->'activities') then raise exception 'activity count mismatch';end if;
  if (select count(*) from public.course_skills where course_slug=r.course_slug and course_version=r.course_version)<>8 or (select count(*) from public.course_rubrics where course_slug=r.course_slug and course_version=r.course_version)<>1 or (select count(*) from private.assessment_question_skills where course_slug=r.course_slug and course_version=r.course_version)<>8 then raise exception 'design promotion mismatch';end if;
  if exists(select 1 from public.course_activities a where a.course_slug=r.course_slug and a.course_version=r.course_version and not exists(select 1 from public.course_activity_skills m where m.activity_id=a.id)) then raise exception 'activity missing skill';end if;
  if not exists(select 1 from private.enrollment_assessment_keys k where k.course_slug=r.course_slug and k.course_version=r.course_version and to_jsonb(k.question_ids)=r.assessment_key->'question_ids' and to_jsonb(k.correct_answers)=r.assessment_key->'correct_answers' and to_jsonb(k.required_lessons)=r.assessment_key->'required_lessons') then raise exception 'private keys mismatch';end if;
 end loop;
 begin perform private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);raise exception 'replacement accepted';exception when serialization_failure then null;end;
end$$;
insert into public.learning_enrollments(user_id,context_type,course_slug,course_version,source)
select id,'personal','excel-basics',1,'kfo' from auth.users where email='ruhaimi.s1@gmail.com';
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
select set_config('kfo.test_enrollment',(select id::text from public.learning_enrollments where user_id=auth.uid() and course_slug='excel-basics'),true);
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.my_course_release(current_setting('kfo.test_enrollment')::uuid);
 if r->>'course_slug'<>'excel-basics' or r ? 'assessment_key' then raise exception 'learner runtime mismatch';end if;
 begin perform private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);raise exception 'client activation permitted';exception when insufficient_privilege then null;end;
 perform public.complete_my_lesson(current_setting('kfo.test_enrollment')::uuid,'excel-unit-1-lesson');
 begin perform public.complete_my_lesson(current_setting('kfo.test_enrollment')::uuid,'excel-final-project');raise exception 'task self-completed';exception when invalid_parameter_value then null;end;
end$$;
reset role;
set local role anon;
do $$begin begin perform private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);raise exception 'anon activation permitted';exception when insufficient_privilege then null;end;end$$;
rollback;
