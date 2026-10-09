-- Company owner setting, scoped across tenants. No fixture persists.
begin;

insert into auth.users (id, instance_id, aud, role) values
  ('70000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('70000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

insert into public.organizations (id, slug, display_name) values
  ('71000000-0000-4000-8000-000000000001', 'kfo-settings-a', 'Company A'),
  ('71000000-0000-4000-8000-000000000002', 'kfo-settings-b', 'Company B');

insert into public.organization_memberships
  (id, organization_id, user_id, status, joined_at) values
  ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'active', now()),
  ('72000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 'active', now()),
  ('72000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', 'active', now());

insert into public.membership_roles
  (organization_id, membership_id, role_code) values
  ('71000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000001', 'CO'),
  ('71000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000002', 'EM'),
  ('71000000-0000-4000-8000-000000000002', '72000000-0000-4000-8000-000000000003', 'EM');

set local role anon;
do $$
begin
  begin
    perform public.update_company_display_name('71000000-0000-4000-8000-000000000001', 'Nope');
    raise exception 'anon renamed company';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000001', true);
do $$
begin
  if public.update_company_display_name('71000000-0000-4000-8000-000000000001', '  Company A Updated  ')
      <> 'Company A Updated' then
    raise exception 'owner rename failed';
  end if;
  perform public.update_company_display_name('71000000-0000-4000-8000-000000000001', 'Company A Updated');
  begin
    perform public.update_company_display_name('71000000-0000-4000-8000-000000000002', 'Cross tenant');
    raise exception 'cross-tenant rename succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.update_company_display_name('71000000-0000-4000-8000-000000000001', ' ');
    raise exception 'invalid name accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000002', true);
do $$
begin
  begin
    perform public.update_company_display_name('71000000-0000-4000-8000-000000000001', 'Employee overwrite');
    raise exception 'employee renamed company';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
do $$
begin
  if (select display_name from public.organizations
      where id='71000000-0000-4000-8000-000000000001') <> 'Company A Updated'
    or (select display_name from public.organizations
      where id='71000000-0000-4000-8000-000000000002') <> 'Company B'
    or (select count(*) from public.audit_events
      where resource_type='organizations'
        and resource_id='71000000-0000-4000-8000-000000000001'
        and action='update'
        and actor_id='70000000-0000-4000-8000-000000000001') <> 1
    or has_table_privilege('authenticated', 'public.organizations', 'update')
  then
    raise exception 'name isolation, audit, or grant invariant failed';
  end if;
end;
$$;

rollback;
