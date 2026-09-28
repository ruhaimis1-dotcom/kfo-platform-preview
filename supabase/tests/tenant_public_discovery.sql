-- Run in a test database or as one transaction through the SQL editor.
-- Fixtures are never committed; the final ROLLBACK removes them.
begin;

insert into public.organizations (id, slug, display_name, tenant_access_enabled) values
  ('00000000-0000-4000-8000-0000000000a1', 'kfo-scope-a', 'KFO scope A', true),
  ('00000000-0000-4000-8000-0000000000b2', 'kfo-scope-b', 'KFO scope B', true),
  ('00000000-0000-4000-8000-0000000000c3', 'kfo-scope-c', 'KFO scope C', false);

insert into public.organization_domains
  (organization_id, hostname, domain_type, status, verified_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'kfo-scope-a.kfo.sa', 'kfo_subdomain', 'verified', now()),
  ('00000000-0000-4000-8000-0000000000b2', 'kfo-scope-b.kfo.sa', 'kfo_subdomain', 'pending', null),
  ('00000000-0000-4000-8000-0000000000c3', 'kfo-scope-c.kfo.sa', 'kfo_subdomain', 'verified', now());

insert into public.tenant_branding (organization_id, portal_name) values
  ('00000000-0000-4000-8000-0000000000a1', 'A'),
  ('00000000-0000-4000-8000-0000000000b2', 'B'),
  ('00000000-0000-4000-8000-0000000000c3', 'C');

set local role anon;

do $$
begin
  if (select count(*) from public.tenant_branding
      where organization_id = '00000000-0000-4000-8000-0000000000a1') <> 1
    or (select count(*) from public.tenant_branding
      where organization_id = '00000000-0000-4000-8000-0000000000b2') <> 0
    or (select count(*) from public.tenant_branding
      where organization_id = '00000000-0000-4000-8000-0000000000c3') <> 0
    or (select count(*) from public.resolve_tenant_host('kfo-scope-a.kfo.sa')) <> 1
    or (select count(*) from public.resolve_tenant_host('kfo-scope-b.kfo.sa')) <> 0
    or (select count(*) from public.resolve_tenant_host('kfo-scope-c.kfo.sa')) <> 0
    or has_column_privilege('anon', 'public.tenant_branding', 'public_contact', 'select')
  then
    raise exception 'public tenant discovery isolation failed';
  end if;
end;
$$;

rollback;
