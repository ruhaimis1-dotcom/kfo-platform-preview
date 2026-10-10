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
