-- Exercise the privileged organization bootstrap without persisting fixtures.
-- The SQL runner must use a trusted database role; browser roles lack EXECUTE.
begin;

insert into auth.users (id, instance_id, aud, role) values
  ('50000000-0000-4000-8000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated');

select set_config('request.jwt.claim.sub',
  '50000000-0000-4000-8000-000000000001', true);
select private.create_organization('KFO Bootstrap Test', 'kfo-bootstrap-test');

do $$
begin
  if (select count(*) from public.organizations
      where slug = 'kfo-bootstrap-test') <> 1
    or (select count(*) from public.organization_domains
      where hostname = 'kfo-bootstrap-test.kfo.sa'
        and status = 'verified' and verified_at is not null) <> 1
    or (select count(*) from public.tenant_branding b
      join public.organizations o on o.id = b.organization_id
      where o.slug = 'kfo-bootstrap-test') <> 1
    or (select count(*) from public.organization_memberships m
      join public.organizations o on o.id = m.organization_id
      join public.membership_roles mr on mr.membership_id = m.id
      where o.slug = 'kfo-bootstrap-test'
        and m.user_id = '50000000-0000-4000-8000-000000000001'
        and m.status = 'active' and mr.role_code = 'CO') <> 1
    or (select count(*) from public.audit_events a
      join public.organizations o on o.id = a.organization_id
      where o.slug = 'kfo-bootstrap-test'
        and a.actor_id = '50000000-0000-4000-8000-000000000001') < 1
  then
    raise exception 'trusted organization bootstrap incomplete';
  end if;
end;
$$;

set local role anon;

do $$
begin
  if (select count(*) from public.resolve_tenant_host('kfo-bootstrap-test.kfo.sa')) <> 1
  then
    raise exception 'bootstrap tenant is not publicly resolvable';
  end if;
end;
$$;

rollback;
