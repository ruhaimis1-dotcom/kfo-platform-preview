-- Applied under explicit QA approval on 2026-10-10; requires private evidence storage gate.
-- Narrow SA review reads; no new table grants or reviewer role grants.
create or replace function public.admin_learning_evidence_detail(p_evidence_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_ev public.learning_evidence; v_en public.learning_enrollments;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501'; end if;
 select * into v_ev from public.learning_evidence where id=p_evidence_id;
 if not found or v_ev.review_status<>'pending' then raise exception 'evidence unavailable' using errcode='42501'; end if;
 select * into v_en from public.learning_enrollments where id=v_ev.enrollment_id;
 if not found or v_en.status<>'active' then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 if exists(select 1 from public.learning_evidence newer where newer.enrollment_id=v_ev.enrollment_id and newer.activity_id=v_ev.activity_id and newer.submitted_at>v_ev.submitted_at)
 then raise exception 'evidence superseded' using errcode='40001'; end if;
 return jsonb_build_object('evidence_id',v_ev.id,'submitted_at',v_ev.submitted_at,'evidence_type',v_ev.evidence_type,'payload',v_ev.payload,
 'activity_title',(select a.title from public.course_activities a where a.id=v_ev.activity_id),
 'rubrics',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'criteria',r.criteria) order by r.title)
 from public.course_rubrics r where r.course_slug=v_en.course_slug and r.course_version=v_en.course_version),'[]'::jsonb));
end $$;
revoke all on function public.admin_learning_evidence_detail(uuid) from public,anon;
grant execute on function public.admin_learning_evidence_detail(uuid) to authenticated;

create or replace function public.admin_submit_evidence_review(p_evidence_id uuid,p_expected_submitted_at timestamptz,p_rubric_id uuid,p_score numeric,p_feedback text,p_status text)
returns public.learning_evidence language plpgsql security definer set search_path='' as $$
declare v_ev public.learning_evidence;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501'; end if;
 if p_score is null or p_score='NaN'::numeric or p_score<0 or p_score>100 or p_status is null or p_status not in ('passed','needs_revision','failed')
 or length(coalesce(p_feedback,''))>4000 or (p_status in ('needs_revision','failed') and length(trim(coalesce(p_feedback,'')))=0)
 then raise exception 'invalid review' using errcode='22023'; end if;
 select * into v_ev from public.learning_evidence where id=p_evidence_id for update;
 if not found or v_ev.review_status<>'pending' or v_ev.submitted_at is distinct from p_expected_submitted_at
 or exists(select 1 from public.learning_evidence newer where newer.enrollment_id=v_ev.enrollment_id and newer.activity_id=v_ev.activity_id and newer.submitted_at>v_ev.submitted_at)
 then raise exception 'review changed; refresh required' using errcode='40001'; end if;
 if not exists(select 1 from public.learning_enrollments en where en.id=v_ev.enrollment_id and en.status='active') then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 return public.review_learning_evidence(p_evidence_id,p_rubric_id,p_score,p_feedback,p_status);
end $$;
revoke all on function public.admin_submit_evidence_review(uuid,timestamptz,uuid,numeric,text,text) from public,anon;
grant execute on function public.admin_submit_evidence_review(uuid,timestamptz,uuid,numeric,text,text) to authenticated;

-- Learner receives feedback on own evidence only; reviewer identity remains private.
create or replace function public.my_learning_review_feedback(p_enrollment_id uuid)
returns table(evidence_id uuid,feedback text)
language sql stable security definer set search_path='' as $$
 select ev.id,latest.feedback from public.learning_evidence ev
 join public.learning_enrollments en on en.id=ev.enrollment_id and en.user_id=auth.uid()
 join lateral(select r.feedback from public.evidence_reviews r where r.evidence_id=ev.id order by r.created_at desc,r.id desc limit 1) latest on true
 where auth.uid() is not null and ev.enrollment_id=p_enrollment_id and ev.user_id=auth.uid();
$$;
revoke all on function public.my_learning_review_feedback(uuid) from public,anon;
grant execute on function public.my_learning_review_feedback(uuid) to authenticated;

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
