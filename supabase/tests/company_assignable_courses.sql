begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
select set_config('kfo.test_org',(select organization_id::text from public.organization_memberships m where m.status='active' and private.company_member_in_reviewer_scope(m.organization_id,m.id) limit 1),true);
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.company_assignable_courses(current_setting('kfo.test_org')::uuid);
 if not exists(select 1 from jsonb_array_elements(r) x where x->>'course_slug'='customer-service-reference') or exists(select 1 from jsonb_array_elements(r) x where x->>'course_slug' in ('excel-basics','power-bi-basics')) then raise exception 'release eligibility mismatch';end if;
 begin perform public.company_assignable_courses('00000000-0000-0000-0000-000000000000');raise exception 'foreign company accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
update private.course_offers set unit_amount_minor=100 where course_slug='customer-service-reference' and course_version=1;
set local role authenticated;
do $$begin if exists(select 1 from jsonb_array_elements(public.company_assignable_courses(current_setting('kfo.test_org')::uuid)) x where x->>'course_slug'='customer-service-reference') then raise exception 'paid course listed';end if;end$$;
reset role;
set local role anon;
do $$begin begin perform public.company_assignable_courses(current_setting('kfo.test_org')::uuid);raise exception 'anon accepted';exception when insufficient_privilege then null;end;end$$;
rollback;
