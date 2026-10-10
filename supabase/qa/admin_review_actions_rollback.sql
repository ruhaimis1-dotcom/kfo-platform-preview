-- Atomic rollback fixtures: any unexpected result aborts migration application.
do $qa$
declare
 em uuid:='45d418a3-a986-4a14-9629-651bee191cfb';
 sa uuid:='be30f8b2-ea2b-4fd9-948f-ba665cb66b4d';
 bm uuid:='3185a595-18ce-4b7c-a06a-69d05eee5325';
 en uuid; ev uuid; newer uuid; act uuid; wrong_rubric uuid; stamp timestamptz; d jsonb; row_result public.learning_evidence;
begin
 begin
  insert into public.learning_enrollments(user_id,context_type,course_slug,course_version,source)
  values(em,'personal','customer-service-reference',1,'kfo') returning id into en;
  select id into strict act from public.course_activities where course_slug='customer-service-reference' and course_version=1 and activity_key='escalation-task';
  insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload)
  values(en,act,em,'structured','{"response":"QA rollback response"}') returning id,submitted_at into ev,stamp;
  insert into public.course_rubrics(course_slug,course_version,rubric_key,title,criteria)
  values('customer-service-reference',2,'qa-version-rejection','QA rollback only','[]') returning id into wrong_rubric;

  -- Anonymous execute denied even when a subject is present.
  perform set_config('request.jwt.claim.sub',sa::text,true);
  execute 'set local role anon';
  begin perform public.admin_learning_evidence_detail(ev);raise exception 'FAIL anonymous detail';exception when insufficient_privilege then null;end;
  execute 'reset role';
  execute 'set local role authenticated';

  -- Learner and branch manager cannot use the new SA read or write endpoints.
  perform set_config('request.jwt.claim.sub',em::text,true);
  begin perform public.admin_learning_evidence_detail(ev);raise exception 'FAIL EM detail';exception when insufficient_privilege then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,80,'QA','passed');raise exception 'FAIL EM review';exception when insufficient_privilege then null;end;
  perform set_config('request.jwt.claim.sub',bm::text,true);
  begin perform public.admin_learning_evidence_detail(ev);raise exception 'FAIL BM detail';exception when insufficient_privilege then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,80,'QA','passed');raise exception 'FAIL BM review';exception when insufficient_privilege then null;end;

  -- SA can inspect a personal submission and exact course-version rubrics.
  perform set_config('request.jwt.claim.sub',sa::text,true);
  d:=public.admin_learning_evidence_detail(ev);
  if d->>'evidence_id'<>ev::text or d->'payload'->>'response'<>'QA rollback response' then raise exception 'FAIL SA detail';end if;
  if exists(select 1 from jsonb_array_elements(d->'rubrics') r where r->>'id'=wrong_rubric::text) then raise exception 'FAIL wrong rubric visible';end if;
  begin perform public.admin_submit_evidence_review(ev,stamp,wrong_rubric,80,'QA','passed');raise exception 'FAIL wrong rubric accepted';exception when invalid_parameter_value then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,null,'QA','passed');raise exception 'FAIL null score';exception when invalid_parameter_value then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,'NaN', 'QA','passed');raise exception 'FAIL NaN';exception when invalid_parameter_value then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,101,'QA','passed');raise exception 'FAIL oversized grade';exception when invalid_parameter_value then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,30,' ','needs_revision');raise exception 'FAIL missing feedback';exception when invalid_parameter_value then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp+interval '1 second',null,80,'QA','passed');raise exception 'FAIL stale stamp';exception when serialization_failure then null;end;

  row_result:=public.admin_submit_evidence_review(ev,stamp,null,55,'حدّد المسؤول والموعد','needs_revision');
  if row_result.review_status<>'needs_revision' then raise exception 'FAIL saved status';end if;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,80,'QA','passed');raise exception 'FAIL duplicate review';exception when serialization_failure then null;end;
  if exists(select 1 from public.my_learning_review_feedback(en)) then raise exception 'FAIL SA reads learner notes';end if;
  perform set_config('request.jwt.claim.sub',em::text,true);
  if not exists(select 1 from public.my_learning_review_feedback(en) f where f.evidence_id=ev and f.feedback='حدّد المسؤول والموعد') then raise exception 'FAIL owned feedback';end if;
  perform set_config('request.jwt.claim.sub',bm::text,true);
  if exists(select 1 from public.my_learning_review_feedback(en)) then raise exception 'FAIL foreign learner notes';end if;
  execute 'reset role';

  if (select count(*) from public.evidence_reviews where evidence_id=ev)<>1 then raise exception 'FAIL duplicate review rows';end if;
  if not exists(select 1 from public.evidence_reviews where evidence_id=ev and reviewer_user_id=sa and reviewer_type='human') then raise exception 'FAIL reviewer identity';end if;

  -- A newer submission makes an older pending item unavailable for review.
  update public.learning_evidence set review_status='pending' where id=ev;
  insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload,submitted_at)
  values(en,act,em,'structured','{"response":"QA newer"}',stamp+interval '2 seconds') returning id into newer;
  perform set_config('request.jwt.claim.sub',sa::text,true);
  execute 'set local role authenticated';
  begin perform public.admin_learning_evidence_detail(ev);raise exception 'FAIL superseded read';exception when serialization_failure then null;end;
  begin perform public.admin_submit_evidence_review(ev,stamp,null,80,'QA','passed');raise exception 'FAIL superseded write';exception when serialization_failure then null;end;
  execute 'reset role';

  -- Temporarily remove SA, retaining Saud's CO role; restoration occurs by subtransaction rollback.
  begin
   delete from public.membership_roles where membership_id='fed23e07-f419-47cc-b0f2-d6d3412e64fc' and role_code='SA';
   perform set_config('request.jwt.claim.sub',sa::text,true);execute 'set local role authenticated';
   begin perform public.admin_learning_evidence_detail(newer);raise exception 'FAIL CO detail';exception when insufficient_privilege then null;end;
   begin perform public.admin_submit_evidence_review(newer,stamp+interval '2 seconds',null,80,'QA','passed');raise exception 'FAIL CO write';exception when insufficient_privilege then null;end;
   execute 'reset role';raise exception using errcode='ZX002',message='restore role fixture';
  exception when sqlstate 'ZX002' then null;end;
  raise exception using errcode='ZX001',message='rollback successful QA fixtures';
 exception when sqlstate 'ZX001' then null;end;
end $qa$;
