-- Authenticated membership/RBAC regression. All fixtures are rolled back.
begin;

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
begin
  if (select count(*) from public.organizations
      where slug like 'kfo-isolation-%') <> 2
    or (select count(*) from public.organization_memberships
      where organization_id = '10000000-0000-4000-8000-000000000002') <> 2
    or (select count(*) from public.organization_memberships
      where organization_id = '10000000-0000-4000-8000-000000000003') <> 0
    or (select count(*) from public.organization_branches
      where organization_id = '10000000-0000-4000-8000-000000000002') <> 1
    or (select count(*) from public.organization_departments
      where organization_id = '10000000-0000-4000-8000-000000000002') <> 1
    or not private.has_org_permission('10000000-0000-4000-8000-000000000001', 'organization.settings.manage')
    or private.has_org_permission('10000000-0000-4000-8000-000000000002', 'organization.settings.manage')
    or not private.has_org_permission('10000000-0000-4000-8000-000000000002', 'members.read', '20000000-0000-4000-8000-000000000001')
    or private.has_org_permission('10000000-0000-4000-8000-000000000002', 'members.read', '20000000-0000-4000-8000-000000000002')
  then
    raise exception 'multi-membership or BM branch isolation failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);

do $$
begin
  if (select count(*) from public.organization_memberships
      where organization_id = '10000000-0000-4000-8000-000000000002') <> 1
    or private.has_org_permission('10000000-0000-4000-8000-000000000002', 'organization.settings.manage')
  then
    raise exception 'employee access exceeded self membership';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000004', true);

do $$
begin
  if (select count(*) from public.organizations
      where slug like 'kfo-isolation-%') <> 1
  then
    raise exception 'cross-tenant organization visibility failed';
  end if;
end;
$$;

rollback;
