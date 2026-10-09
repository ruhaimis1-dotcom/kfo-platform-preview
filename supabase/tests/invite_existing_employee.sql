-- Atomic existing-user invitation and acceptance, with tenant isolation.
begin;

insert into auth.users (id, instance_id, aud, role) values
  ('80000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('80000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('80000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

insert into public.organizations (id, slug, display_name, tenant_access_enabled) values
  ('81000000-0000-4000-8000-000000000001', 'kfo-invite-issued-a', 'Company A', true),
  ('81000000-0000-4000-8000-000000000002', 'kfo-invite-issued-b', 'Company B', true);
insert into public.organization_memberships
  (id, organization_id, user_id, status, joined_at) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'active', now()),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000002', 'active', now());
insert into public.membership_roles
  (organization_id, membership_id, role_code) values
  ('81000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000001', 'CO'),
  ('81000000-0000-4000-8000-000000000002', '82000000-0000-4000-8000-000000000002', 'CO');
update public.organizations set tenant_access_enabled = false
  where id = '81000000-0000-4000-8000-000000000002';

set local role anon;
do $$
begin
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000003');
    raise exception 'anonymous invitation created';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);
do $$
declare
  v_id uuid;
begin
  v_id := public.invite_existing_employee('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000003');
  if v_id is null then raise exception 'invitation not created'; end if;
  begin
    insert into public.membership_roles (organization_id, membership_id, role_code)
    values ('81000000-0000-4000-8000-000000000001', v_id, 'CO');
    raise exception 'direct owner role escalation succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000003');
    raise exception 'duplicate invitation accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000003');
    raise exception 'cross-tenant invitation created';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000099');
    raise exception 'unknown user invitation created';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true);
do $$
begin
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000003');
    raise exception 'disabled company invitation created';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000003', true);
do $$
declare
  v_id uuid;
begin
  select id into v_id from public.organization_memberships
    where organization_id = '81000000-0000-4000-8000-000000000001'
      and user_id = auth.uid() and status = 'invited';
  if v_id is null or public.accept_invitation(v_id) <> v_id then
    raise exception 'invitee acceptance failed';
  end if;
  begin
    perform public.invite_existing_employee('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000002');
    raise exception 'employee issued invitation';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
do $$
begin
  if (select count(*) from public.organization_memberships m
      join public.membership_roles r on r.membership_id = m.id and r.organization_id = m.organization_id
      where m.organization_id='81000000-0000-4000-8000-000000000001'
        and m.user_id='80000000-0000-4000-8000-000000000003'
        and m.status='active' and m.joined_at is not null and r.role_code='EM') <> 1
    or (select count(*) from public.organization_memberships
      where organization_id='81000000-0000-4000-8000-000000000002') <> 1
    or (select count(*) from public.audit_events
      where resource_type='organization_memberships'
        and organization_id='81000000-0000-4000-8000-000000000001'
        and actor_id='80000000-0000-4000-8000-000000000001'
        and action='insert') <> 1
  then
    raise exception 'atomic invitation, isolation or grant invariant failed';
  end if;
end;
$$;

rollback;
