begin;
insert into private.course_offers(course_slug,course_version,title,unit_amount_minor,published) values ('qa-orders-restore-free-20261015',1,'QA free',0,true),('qa-orders-restore-paid-20261015',1,'QA paid',1200,true);
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select set_config('kfo.restore.org',public.admin_create_organization('QA orders recovery','qa-orders-restore-20261015','saud@hirely.sa')::text,true);
do $$declare a jsonb;b jsonb;k uuid:=extensions.gen_random_uuid();begin
 a:=public.create_my_course_order('qa-orders-restore-free-20261015',1,k);
 b:=public.create_my_course_order('qa-orders-restore-free-20261015',1,k);
 if a->>'id'<>b->>'id' or a->>'status'<>'free_confirmed' or a->>'enrollment_id' is null then raise exception 'free/replay failed';end if;
 a:=public.create_my_course_order('qa-orders-restore-paid-20261015',1,extensions.gen_random_uuid());
 if a->>'status'<>'awaiting_payment' or a->>'enrollment_id' is not null or a->>'amount_minor'<>'1200' then raise exception 'paid unlocked';end if;
 k:=extensions.gen_random_uuid();
 a:=public.create_company_course_order(current_setting('kfo.restore.org')::uuid,'qa-orders-restore-paid-20261015',1,3,k);
 b:=public.create_company_course_order(current_setting('kfo.restore.org')::uuid,'qa-orders-restore-paid-20261015',1,3,k);
 if a->>'id'<>b->>'id' or a->>'status'<>'awaiting_payment' or a->>'amount_minor'<>'3600' then raise exception 'company paid/replay failed';end if;
 a:=public.create_company_course_order(current_setting('kfo.restore.org')::uuid,'qa-orders-restore-free-20261015',1,3,extensions.gen_random_uuid());
 if a->>'status'<>'free_confirmed' or a->>'amount_minor'<>'0' then raise exception 'company free failed';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.company_course_order_history(current_setting('kfo.restore.org')::uuid);raise exception 'foreign company history allowed';exception when insufficient_privilege then null;end;
 if exists(select 1 from jsonb_array_elements(public.my_course_order_history()) x where x->>'course_slug' like 'qa-orders-restore-%') then raise exception 'other user orders visible';end if;
end $$;
reset role;
do $$begin
 if exists(select 1 from public.learning_enrollments where course_slug='qa-orders-restore-paid-20261015') then raise exception 'paid enrollment exists';end if;
end $$;
rollback;
