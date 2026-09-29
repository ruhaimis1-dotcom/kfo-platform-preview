-- Existing-user invitation RPC authorization and idempotency.
-- This transaction creates no lasting Auth users or organizations.
begin;

insert into auth.users (id, instance_id, aud, role) values
  ('60000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('60000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

insert into public.organizations (id, slug, display_name, tenant_access_enabled) values
  ('61000000-0000-4000-8000-000000000001', 'kfo-invite-a', 'Invite A', true),
  ('61000000-0000-4000-8000-000000000002', 'kfo-invite-b', 'Invite B', true),
  ('61000000-0000-4000-8000-000000000003', 'kfo-invite-disabled', 'Invite Disabled', false);

insert into public.organization_memberships
  (id, organization_id, user_id, status) values
  ('62000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'invited'),
  ('62000000-0000-4000-8000-000000000002', '61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'invited'),
  ('62000000-0000-4000-8000-000000000003', '61000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 'invited'),
  ('62000000-0000-4000-8000-000000000004', '61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', 'invited');

insert into public.membership_roles
  (organization_id, membership_id, role_code) values
  ('61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000001', 'EM'),
  ('61000000-0000-4000-8000-000000000002', '62000000-0000-4000-8000-000000000002', 'EM'),
  ('61000000-0000-4000-8000-000000000003', '62000000-0000-4000-8000-000000000003', 'EM');

set local role anon;
do $$
begin
  begin
    perform public.accept_invitation('62000000-0000-4000-8000-000000000001');
    raise exception 'anonymous invitation accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true);

do $$
begin
  if public.accept_invitation('62000000-0000-4000-8000-000000000001')
      <> '62000000-0000-4000-8000-000000000001' then
    raise exception 'own invitation was not accepted';
  end if;
  -- Retry after a lost response succeeds without a second UPDATE.
  perform public.accept_invitation('62000000-0000-4000-8000-000000000001');

  begin
    perform public.accept_invitation('62000000-0000-4000-8000-000000000002');
    raise exception 'cross-user invitation accepted';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.accept_invitation('62000000-0000-4000-8000-000000000003');
    raise exception 'disabled organization invitation accepted';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.accept_invitation('62000000-0000-4000-8000-000000000004');
    raise exception 'another user invitation accepted';
  exception when insufficient_privilege then null;
  end;

  if (select count(*) from public.organization_memberships
      where id = '62000000-0000-4000-8000-000000000001'
        and status = 'active' and joined_at is not null) <> 1
  then
    raise exception 'first invitation acceptance state failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    perform public.accept_invitation('62000000-0000-4000-8000-000000000004');
    raise exception 'roleless invitation accepted';
  exception when insufficient_privilege then null;
  end;
  perform public.accept_invitation('62000000-0000-4000-8000-000000000002');
  if (select count(*) from public.organization_memberships
      where id = '62000000-0000-4000-8000-000000000002'
        and status = 'active' and joined_at is not null) <> 1 then
    raise exception 'second user invitation was not accepted';
  end if;
end;
$$;

-- Inspect audit rows as the trusted SQL runner; the invited employee should
-- not need permission to read the audit table to accept an invitation.
reset role;
do $$
begin
  if (select count(*) from public.organization_memberships
      where id = '62000000-0000-4000-8000-000000000003'
        and status = 'invited') <> 1
    or (select count(*) from public.organization_memberships
      where id = '62000000-0000-4000-8000-000000000004'
        and status = 'invited') <> 1
    or (select count(*) from public.audit_events
      where resource_type = 'organization_memberships'
        and resource_id = '62000000-0000-4000-8000-000000000001'
        and action = 'update'
        and actor_id = '60000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.audit_events
      where resource_type = 'organization_memberships'
        and resource_id = '62000000-0000-4000-8000-000000000002'
        and action = 'update'
        and actor_id = '60000000-0000-4000-8000-000000000002') <> 1
    or has_table_privilege('authenticated',
      'public.organization_memberships', 'update')
  then
    raise exception 'audit or grant invariant failed';
  end if;
end;
$$;

rollback;
