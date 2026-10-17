begin;
select set_config('kfo.cert_user',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
insert into public.learner_profiles(user_id,display_name) values(current_setting('kfo.cert_user')::uuid,'اسم وقت الإصدار') on conflict(user_id) do update set display_name=excluded.display_name;
insert into private.course_offers(course_slug,course_version,title,published) values('qa-certificate-snapshot',1,'دورة وقت الإصدار',false);
insert into public.learning_enrollments(user_id,context_type,course_slug,course_version,source,status) values(current_setting('kfo.cert_user')::uuid,'personal','qa-certificate-snapshot',1,'kfo','completed');
select set_config('kfo.cert_enrollment',(select id::text from public.learning_enrollments where user_id=current_setting('kfo.cert_user')::uuid and course_slug='qa-certificate-snapshot'),true);
insert into public.enrollment_assessment_attempts(enrollment_id,user_id,score_percent,passed) values(current_setting('kfo.cert_enrollment')::uuid,current_setting('kfo.cert_user')::uuid,90,true);
insert into public.enrollment_completions(enrollment_id,user_id,passing_attempt_id) select enrollment_id,user_id,id from public.enrollment_assessment_attempts where enrollment_id=current_setting('kfo.cert_enrollment')::uuid;
insert into public.learner_certificates(completion_id,user_id) select id,user_id from public.enrollment_completions where enrollment_id=current_setting('kfo.cert_enrollment')::uuid;
select set_config('kfo.cert_code',(select certificate_code from public.learner_certificates where completion_id=(select id from public.enrollment_completions where enrollment_id=current_setting('kfo.cert_enrollment')::uuid)),true);
update public.learner_profiles set display_name='اسم لاحق' where user_id=current_setting('kfo.cert_user')::uuid;
update private.course_offers set title='عنوان لاحق' where course_slug='qa-certificate-snapshot';
do $$begin
 if not exists(select 1 from public.learner_certificates where certificate_code=current_setting('kfo.cert_code') and holder_name='اسم وقت الإصدار' and course_title='دورة وقت الإصدار') then raise exception 'issue snapshot changed';end if;
 begin update public.learner_certificates set holder_name='تزوير' where certificate_code=current_setting('kfo.cert_code');raise exception 'snapshot mutation accepted';exception when invalid_parameter_value then null;end;
end$$;
set local role anon;
do $$declare r jsonb;begin
 r:=public.verify_learner_certificate(current_setting('kfo.cert_code'));
 if r->>'status'<>'valid' or r->>'course_title'<>'دورة وقت الإصدار' or r ?| array['user_id','holder_name','email','completion_id','score'] then raise exception 'public response mismatch';end if;
 if public.verify_learner_certificate('KFO-0000000000000000')->>'status'<>'unavailable' then raise exception 'unknown certificate accepted';end if;
end$$;
reset role;
update public.learner_certificates set revoked_at=now() where certificate_code=current_setting('kfo.cert_code');
set local role anon;
do $$begin if public.verify_learner_certificate(current_setting('kfo.cert_code'))->>'status'<>'revoked' then raise exception 'revocation ignored';end if;end$$;
rollback;
