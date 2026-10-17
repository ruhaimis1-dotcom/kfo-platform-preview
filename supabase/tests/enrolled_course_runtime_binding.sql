begin;
insert into public.learning_enrollments(user_id,context_type,course_slug,course_version,source)
select id,'personal','excel-basics',1,'kfo' from auth.users where email='ruhaimi.s1@gmail.com';
insert into private.course_runtime_bindings(course_slug,course_version,release_id)
select course_slug,course_version,id from private.course_release_snapshots where id='9258a28c-c395-433d-8b30-c249e50cb4b7';
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
select set_config('kfo.test_enrollment',(select id::text from public.learning_enrollments where user_id=auth.uid() and course_slug='excel-basics' and status='active'),true);
set local role authenticated;
do $$begin
 begin perform public.my_course_release(current_setting('kfo.test_enrollment')::uuid);raise exception 'unpublished release exposed';exception when invalid_parameter_value then null;end;
end$$;
reset role;
update private.course_offers set published=true where course_slug='excel-basics' and course_version=1;
update private.course_authoring set runtime_ready=true where course_slug='excel-basics' and course_version=1;
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.my_course_release(current_setting('kfo.test_enrollment')::uuid);
 if r->>'status'<>'enrolled_release' or r->>'course_slug'<>'excel-basics' or r->>'user_id'<>auth.uid()::text or r->>'release_id'<>'9258a28c-c395-433d-8b30-c249e50cb4b7' or r ? 'assessment_key' or jsonb_array_length(r->'assessment'->'questions')<>8 then raise exception 'runtime mismatch';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$begin begin perform public.my_course_release(current_setting('kfo.test_enrollment')::uuid);raise exception 'foreign enrollment exposed';exception when insufficient_privilege then null;end;end$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
update public.learning_enrollments set status='cancelled' where id=current_setting('kfo.test_enrollment')::uuid;
set local role authenticated;
do $$begin begin perform public.my_course_release(current_setting('kfo.test_enrollment')::uuid);raise exception 'cancelled enrollment exposed';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role anon;
do $$begin begin perform public.my_course_release(current_setting('kfo.test_enrollment')::uuid);raise exception 'anonymous access accepted';exception when insufficient_privilege then null;end;end$$;
rollback;
