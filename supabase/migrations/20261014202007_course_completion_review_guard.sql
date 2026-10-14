-- Completion validates server activity types; evidence requires an approved review.
create or replace function private.complete_my_lesson(p_enrollment_id uuid,p_lesson_id text)
returns public.enrollment_progress language plpgsql security definer set search_path='' as $$
declare e public.learning_enrollments%rowtype;a public.course_activities%rowtype;r public.enrollment_progress;
begin
 if auth.uid() is null then raise exception 'authenticated identity required' using errcode='42501';end if;
 select * into e from public.learning_enrollments where id=p_enrollment_id and user_id=auth.uid() and status='active' for update;
 if not found then raise exception 'enrollment unavailable' using errcode='42501';end if;
 select * into a from public.course_activities where course_slug=e.course_slug and course_version=e.course_version and activity_key=btrim(p_lesson_id);
 if not found or a.activity_type not in ('content','quick_check','scenario','ordering','error_spotting','simulation') then raise exception 'activity cannot be self-completed' using errcode='22023';end if;
 insert into public.enrollment_progress(enrollment_id,user_id,lesson_id,completed_at,updated_at)
 values(e.id,auth.uid(),a.activity_key,now(),now())
 on conflict(enrollment_id,lesson_id) do update set completed_at=coalesce(public.enrollment_progress.completed_at,excluded.completed_at),updated_at=now() returning * into r;
 return r;
end $$;
revoke all on function private.complete_my_lesson(uuid,text) from public,anon,authenticated;
grant execute on function private.complete_my_lesson(uuid,text) to authenticated;
create or replace function public.complete_my_lesson(p_enrollment_id uuid,p_lesson_id text) returns public.enrollment_progress language sql security invoker set search_path='' as $$select private.complete_my_lesson(p_enrollment_id,p_lesson_id);$$;
revoke all on function public.complete_my_lesson(uuid,text) from public,anon,authenticated;
grant execute on function public.complete_my_lesson(uuid,text) to authenticated;
CREATE OR REPLACE FUNCTION private.submit_official_assessment(p_enrollment_id uuid, p_question_ids text[], p_answers integer[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_e public.learning_enrollments%rowtype; v_key private.enrollment_assessment_keys%rowtype;
v_done integer; v_score numeric; v_passed boolean; v_attempt uuid; v_completion uuid; v_certificate text;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select * into v_e from public.learning_enrollments e where e.id=p_enrollment_id and e.user_id=v_uid and e.status='active' for update;
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 select * into v_key from private.enrollment_assessment_keys k where k.course_slug=v_e.course_slug and k.course_version=v_e.course_version;
 if not found then raise exception 'assessment unavailable' using errcode='22023'; end if;
 if p_question_ids is distinct from v_key.question_ids or p_answers is null or cardinality(p_answers)<>cardinality(v_key.correct_answers) or array_position(p_answers,null) is not null then raise exception 'assessment payload mismatch' using errcode='22023'; end if;
 select count(distinct completed_key) into v_done
 from (
   select p.lesson_id as completed_key
   from public.enrollment_progress p
   join public.course_activities pa on pa.course_slug=v_e.course_slug and pa.course_version=v_e.course_version and pa.activity_key=p.lesson_id
     and pa.activity_type not in ('reflection','practical_task','file_evidence','assessment')
   where p.enrollment_id=v_e.id and p.user_id=v_uid and p.completed_at is not null
     and p.lesson_id=any(v_key.required_lessons)
   union
   select a.activity_key as completed_key
   from public.learning_evidence ev
   join public.course_activities a on a.id=ev.activity_id
   where ev.enrollment_id=v_e.id and ev.user_id=v_uid and ev.review_status='passed'
     and a.course_slug=v_e.course_slug and a.course_version=v_e.course_version
     and a.activity_type in ('reflection','practical_task','file_evidence')
     and a.activity_key=any(v_key.required_lessons)
 ) completed;
 if v_done<>cardinality(v_key.required_lessons) then raise exception 'required activities incomplete' using errcode='22023'; end if;
 select 100.0*count(*) filter(where x.answer=x.correct)/cardinality(p_answers) into v_score from unnest(p_answers,v_key.correct_answers) x(answer,correct);
 v_passed:=v_score>=v_key.pass_percent;
 insert into public.enrollment_assessment_attempts(enrollment_id,user_id,score_percent,passed) values(v_e.id,v_uid,v_score,v_passed) returning id into v_attempt;
 perform private.record_post_skill_scores(v_e.id,p_question_ids,p_answers,v_key.correct_answers);
 if v_passed then
  insert into public.enrollment_completions(enrollment_id,user_id,passing_attempt_id) values(v_e.id,v_uid,v_attempt)
  on conflict(enrollment_id) do update set passing_attempt_id=excluded.passing_attempt_id returning id into v_completion;
  update public.learning_enrollments set status='completed' where id=v_e.id;
  insert into public.learner_certificates(completion_id,user_id) values(v_completion,v_uid) on conflict(completion_id) do nothing;
  select certificate_code into v_certificate from public.learner_certificates where completion_id=v_completion;
  insert into public.learner_notifications(user_id,kind,title,body,enrollment_id)
  values(v_uid,'certificate','صدرت شهادتك','أكملت متطلبات الدورة وصدرت شهادتك في كفو.',v_e.id);
 else
  insert into public.learner_notifications(user_id,kind,title,body,enrollment_id)
  values(v_uid,'assessment_result','نتيجة الاختبار','تم تسجيل نتيجة الاختبار. يمكنك مراجعة المحتوى والمحاولة مجددًا.',v_e.id);
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score_percent',v_score,'passed',v_passed,'certificate_code',v_certificate);
end $function$
;
revoke all on function private.submit_official_assessment(uuid,text[],integer[]) from public,anon,authenticated;
grant execute on function private.submit_official_assessment(uuid,text[],integer[]) to authenticated;
create or replace function public.submit_official_assessment(p_enrollment_id uuid,p_question_ids text[],p_answers integer[]) returns jsonb language sql security invoker set search_path='' as $$select private.submit_official_assessment(p_enrollment_id,p_question_ids,p_answers);$$;
revoke all on function public.submit_official_assessment(uuid,text[],integer[]) from public,anon,authenticated;
grant execute on function public.submit_official_assessment(uuid,text[],integer[]) to authenticated;
