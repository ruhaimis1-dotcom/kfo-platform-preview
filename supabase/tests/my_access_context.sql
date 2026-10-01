-- Role-context integration fixture. Wrap with proposal in BEGIN/ROLLBACK.

insert into auth.users (id, instance_id, aud, role) values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

insert into public.organizations (id, slug, display_name) values
  ('10000000-0000-4000-8000-000000000001', 'kfo-isolation-a', 'Isolation A'),
  ('10000000-0000-4000-8000-000000000002', 'kfo-isolation-b', 'Isolation B'),
  ('10000000-0000-4000-8000-000000000003', 'kfo-isolation-c', 'Isolation C');

insert into public.organization_branches (id, organization_id, name) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'B branch 1'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'B branch 2');

insert into public.organization_departments (id, organization_id, branch_id, name) values
  ('25000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'B department 1'),
  ('25000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'B department 2');

insert into public.organization_memberships
  (id, organization_id, user_id, branch_id, status, joined_at) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', null, 'active', now()),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'active', now()),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'active', now()),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'active', now()),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004', null, 'active', now());

insert into public.membership_roles
  (organization_id, membership_id, role_code, branch_id) values
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'CO', null),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'BM', '20000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'EM', '20000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', 'EM', '20000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005', 'CO', null);


set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
do $$
declare c jsonb := public.my_access_context();
begin
  if jsonb_array_length(c) <> 2
    or c #>> '{0,roles,0,code}' <> 'CO'
    or c #>> '{1,roles,0,code}' <> 'BM'
    or c #>> '{1,roles,0,branch_id}' <> '20000000-0000-4000-8000-000000000001'
    or not ((c #> '{0,roles,0,permissions}') ? 'organization.settings.manage')
    or ((c #> '{1,roles,0,permissions}') ? 'organization.settings.manage')
  then raise exception 'multi-company context or scope failed'; end if;
end; $$;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000002","user_metadata":{"role":"SA"}}', true);
do $$
declare c jsonb := public.my_access_context();
begin
  if (select count(*) from public.membership_roles) <> 0
    or jsonb_array_length(c) <> 1 or c #>> '{0,roles,0,code}' <> 'EM'
    or c #> '{0,roles,0,permissions}' <> '[]'::jsonb
    or c #>> '{0,membership_id}' <> '30000000-0000-4000-8000-000000000003'
  then raise exception 'employee own role or metadata isolation failed'; end if;
end; $$;
reset role;
update public.organization_memberships set status = 'inactive', ended_at = now()
where id = '30000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$ begin
  if public.my_access_context() <> '[]'::jsonb then raise exception 'inactive member context leaked'; end if;
end; $$;
reset role;
update public.organizations set tenant_access_enabled = false
where id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000001"}', true);
do $$ begin
  if jsonb_array_length(public.my_access_context()) <> 1 then raise exception 'disabled company context leaked'; end if;
end; $$;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
do $$ begin
  begin
    perform public.my_access_context();
    raise exception 'missing identity accepted';
  exception when insufficient_privilege then null; end;
end; $$;
set local role anon;
do $$ begin
  begin
    perform public.my_access_context();
    raise exception 'anonymous context accepted';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
select 'role context: multi-company, CO/BM scopes, EM self, forged metadata, inactive member, disabled company, missing identity and anonymous denial passed' as result;
