begin;
select plan(18);

-- Isolated two-tenant fixture. Supabase local provides auth/storage schemas and pgTAP.
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
 ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'a@example.test', '', now(), now(), now()),
 ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'b@example.test', '', now(), now(), now()),
 ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'manager@example.test', '', now(), now(), now());
insert into public.organizations (id, slug, display_name) values
 ('20000000-0000-4000-8000-000000000001', 'tenant-a-test', 'Tenant A'),
 ('20000000-0000-4000-8000-000000000002', 'tenant-b-test', 'Tenant B'),
 ('20000000-0000-4000-8000-000000000003', 'tenant-c-test', 'Tenant C');
insert into public.organization_domains (organization_id, hostname, domain_type, status, verified_at) values
 ('20000000-0000-4000-8000-000000000001', 'tenant-a-test.kfo.sa', 'kfo_subdomain', 'verified', now()),
 ('20000000-0000-4000-8000-000000000002', 'tenant-b-test.kfo.sa', 'kfo_subdomain', 'verified', now()),
 ('20000000-0000-4000-8000-000000000003', 'tenant-c-test.kfo.sa', 'kfo_subdomain', 'verified', now());
insert into public.organization_branches (id, organization_id, name) values
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'A North'),
 ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'A South');
insert into public.organization_memberships (id, organization_id, user_id, branch_id, status, joined_at) values
 ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 'active', now()),
 ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 'active', now()),
 ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', null, 'active', now()),
 ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'active', now());
insert into public.membership_roles (organization_id, membership_id, role_code) values
 ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'CO'),
 ('20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'FI'),
 ('20000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'FI');
insert into public.membership_roles (organization_id, membership_id, role_code, branch_id) values
 ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 'BM', '30000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select ok(private.is_org_member('20000000-0000-4000-8000-000000000001'), 'active member sees own tenant membership');
select ok(not private.is_org_member('20000000-0000-4000-8000-000000000002'), 'tenant A identity is not member of tenant B');
select ok(private.is_org_member('20000000-0000-4000-8000-000000000003'), 'one identity can have a second organization membership');
select ok(private.has_org_permission('20000000-0000-4000-8000-000000000001', 'organization.settings.manage'), 'CO has authorized tenant permission');
select ok(not private.has_org_permission('20000000-0000-4000-8000-000000000002', 'organization.settings.manage'), 'tenant B permission denied');
select is((select count(*)::int from public.organizations), 2, 'RLS shows only the two organizations where this identity has memberships');
select is((select count(*)::int from public.organization_memberships), 2, 'RLS hides unrelated membership while preserving both of this identity memberships');
select is((select count(*)::int from public.resolve_tenant_host('tenant-a-test.kfo.sa')), 1, 'verified tenant host resolves');
select is((select count(*)::int from public.resolve_tenant_host('tenant-b-test.kfo.sa')), 1, 'exact host returns portal branding metadata only');
select isnt(private.request_custom_domain('20000000-0000-4000-8000-000000000001', 'academy.tenant-a.example'), null, 'company admin can request a custom domain');
select is((select count(*)::int from public.resolve_tenant_host('academy.tenant-a.example')), 0, 'pending custom domain does not resolve before platform verification');
select is((select count(*)::int from public.organization_domains where hostname = 'tenant-b-test.kfo.sa'), 0, 'tenant A cannot enumerate tenant B domain rows');
select is((select count(*)::int from public.organization_branches where organization_id = '20000000-0000-4000-8000-000000000002'), 0, 'tenant A cannot enumerate tenant B branches');
select is((select count(*)::int from public.organization_departments where organization_id = '20000000-0000-4000-8000-000000000002'), 0, 'tenant A cannot enumerate tenant B departments');
select throws_ok($$insert into public.organization_branches (organization_id, name) values ('20000000-0000-4000-8000-000000000002', 'forbidden')$$, '42501', null, 'cross-tenant branch insert is denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select ok(private.has_org_permission('20000000-0000-4000-8000-000000000001', 'assignments.manage', '30000000-0000-4000-8000-000000000001'), 'branch manager permission applies in assigned branch');
select ok(not private.has_org_permission('20000000-0000-4000-8000-000000000001', 'assignments.manage', '30000000-0000-4000-8000-000000000002'), 'branch manager permission is denied outside assigned branch');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select ok(not private.has_org_permission('20000000-0000-4000-8000-000000000002', 'content.library.read'), 'FI is denied private content by default');

select * from finish();
rollback;
