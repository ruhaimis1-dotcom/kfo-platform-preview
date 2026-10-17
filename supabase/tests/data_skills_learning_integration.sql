-- Database-only integration fixtures, not browser or real file/application QA.
begin;

select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
select private.activate_course_release('9258a28c-c395-433d-8b30-c249e50cb4b7',1,1);
insert into public.learner_profiles(user_id,display_name) select id,'متدرب اختبار الربط' from auth.users where email='ruhaimi.s1@gmail.com' on conflict(user_id) do update set display_name=excluded.display_name;
do $$begin
 perform set_config('kfo.qa_questions',(select to_jsonb(question_ids)::text from private.enrollment_assessment_keys where course_slug='excel-basics' and course_version=1),true);
 perform set_config('kfo.qa_answers',(select to_jsonb(correct_answers)::text from private.enrollment_assessment_keys where course_slug='excel-basics' and course_version=1),true);
end$$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare o jsonb;r jsonb;a record;ev public.learning_evidence;qs text[];ans integer[];begin
 o:=public.create_my_course_order('excel-basics',1,gen_random_uuid());
 if o->>'status'<>'free_confirmed' or o->>'enrollment_id' is null then raise exception 'free enrollment failed';end if;
 perform set_config('kfo.qa_enrollment',o->>'enrollment_id',true);
 r:=public.my_course_release((o->>'enrollment_id')::uuid);
 if r->>'course_slug'<>'excel-basics' then raise exception 'wrong runtime';end if;
 for a in select * from public.course_activities where course_slug='excel-basics' and course_version=1 loop
  if a.activity_type='content' then perform public.complete_my_lesson((o->>'enrollment_id')::uuid,a.activity_key);
  elsif a.activity_type='practical_task' then
   ev:=public.submit_my_learning_evidence((o->>'enrollment_id')::uuid,a.id,'structured','{"qa_fixture":true,"summary":"Synthetic integration evidence; no real Excel or Power BI validation"}'::jsonb);
   perform set_config('kfo.qa_evidence',ev.id::text,true);
  end if;
 end loop;
 qs:=array(select jsonb_array_elements_text(current_setting('kfo.qa_questions')::jsonb));
 ans:=array(select v::integer from jsonb_array_elements_text(current_setting('kfo.qa_answers')::jsonb) v);
 begin perform public.submit_official_assessment((o->>'enrollment_id')::uuid,qs,ans);raise exception 'unreviewed evidence accepted';exception when invalid_parameter_value then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
do $$declare detail jsonb;begin
 detail:=public.admin_learning_evidence_detail(current_setting('kfo.qa_evidence')::uuid);
 perform public.admin_submit_evidence_review((detail->>'evidence_id')::uuid,(detail->>'submitted_at')::timestamptz,(detail->'rubrics'->0->>'id')::uuid,90,'Synthetic rollback-only integration review','passed');
end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare r jsonb;qs text[];ans integer[];cert public.learner_certificates;begin
 qs:=array(select jsonb_array_elements_text(current_setting('kfo.qa_questions')::jsonb));
 ans:=array(select v::integer from jsonb_array_elements_text(current_setting('kfo.qa_answers')::jsonb) v);
 r:=public.submit_official_assessment(current_setting('kfo.qa_enrollment')::uuid,qs,ans);
 if (r->>'passed')::boolean is distinct from true or (r->>'score_percent')::numeric<>100 or r->>'certificate_code' is null then raise exception 'completion failed';end if;
 perform set_config('kfo.qa_certificate',r->>'certificate_code',true);
 select * into cert from public.learner_certificates where certificate_code=r->>'certificate_code';
 if cert.holder_name is distinct from 'متدرب اختبار الربط' or cert.course_title is null then raise exception 'certificate snapshot missing';end if;
 if (select count(*) from public.skill_measurements where enrollment_id=current_setting('kfo.qa_enrollment')::uuid and stage='post')<>8 then raise exception 'post skill measurements missing';end if;
end$$;
reset role;
set local role anon;
do $$begin if public.verify_learner_certificate(current_setting('kfo.qa_certificate'))->>'status'<>'valid' then raise exception 'public verification failed';end if;end$$;
reset role;


select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
select private.activate_course_release('a89992df-c64e-445b-b72e-48ab92ad4a84',1,1);
insert into public.learner_profiles(user_id,display_name) select id,'متدرب اختبار الربط' from auth.users where email='ruhaimi.s1@gmail.com' on conflict(user_id) do update set display_name=excluded.display_name;
do $$begin
 perform set_config('kfo.qa_questions',(select to_jsonb(question_ids)::text from private.enrollment_assessment_keys where course_slug='power-bi-basics' and course_version=1),true);
 perform set_config('kfo.qa_answers',(select to_jsonb(correct_answers)::text from private.enrollment_assessment_keys where course_slug='power-bi-basics' and course_version=1),true);
end$$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare o jsonb;r jsonb;a record;ev public.learning_evidence;qs text[];ans integer[];begin
 o:=public.create_my_course_order('power-bi-basics',1,gen_random_uuid());
 if o->>'status'<>'free_confirmed' or o->>'enrollment_id' is null then raise exception 'free enrollment failed';end if;
 perform set_config('kfo.qa_enrollment',o->>'enrollment_id',true);
 r:=public.my_course_release((o->>'enrollment_id')::uuid);
 if r->>'course_slug'<>'power-bi-basics' then raise exception 'wrong runtime';end if;
 for a in select * from public.course_activities where course_slug='power-bi-basics' and course_version=1 loop
  if a.activity_type='content' then perform public.complete_my_lesson((o->>'enrollment_id')::uuid,a.activity_key);
  elsif a.activity_type='practical_task' then
   ev:=public.submit_my_learning_evidence((o->>'enrollment_id')::uuid,a.id,'structured','{"qa_fixture":true,"summary":"Synthetic integration evidence; no real Excel or Power BI validation"}'::jsonb);
   perform set_config('kfo.qa_evidence',ev.id::text,true);
  end if;
 end loop;
 qs:=array(select jsonb_array_elements_text(current_setting('kfo.qa_questions')::jsonb));
 ans:=array(select v::integer from jsonb_array_elements_text(current_setting('kfo.qa_answers')::jsonb) v);
 begin perform public.submit_official_assessment((o->>'enrollment_id')::uuid,qs,ans);raise exception 'unreviewed evidence accepted';exception when invalid_parameter_value then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
do $$declare detail jsonb;begin
 detail:=public.admin_learning_evidence_detail(current_setting('kfo.qa_evidence')::uuid);
 perform public.admin_submit_evidence_review((detail->>'evidence_id')::uuid,(detail->>'submitted_at')::timestamptz,(detail->'rubrics'->0->>'id')::uuid,90,'Synthetic rollback-only integration review','passed');
end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare r jsonb;qs text[];ans integer[];cert public.learner_certificates;begin
 qs:=array(select jsonb_array_elements_text(current_setting('kfo.qa_questions')::jsonb));
 ans:=array(select v::integer from jsonb_array_elements_text(current_setting('kfo.qa_answers')::jsonb) v);
 r:=public.submit_official_assessment(current_setting('kfo.qa_enrollment')::uuid,qs,ans);
 if (r->>'passed')::boolean is distinct from true or (r->>'score_percent')::numeric<>100 or r->>'certificate_code' is null then raise exception 'completion failed';end if;
 perform set_config('kfo.qa_certificate',r->>'certificate_code',true);
 select * into cert from public.learner_certificates where certificate_code=r->>'certificate_code';
 if cert.holder_name is distinct from 'متدرب اختبار الربط' or cert.course_title is null then raise exception 'certificate snapshot missing';end if;
 if (select count(*) from public.skill_measurements where enrollment_id=current_setting('kfo.qa_enrollment')::uuid and stage='post')<>8 then raise exception 'post skill measurements missing';end if;
end$$;
reset role;
set local role anon;
do $$begin if public.verify_learner_certificate(current_setting('kfo.qa_certificate'))->>'status'<>'valid' then raise exception 'public verification failed';end if;end$$;
reset role;

rollback;