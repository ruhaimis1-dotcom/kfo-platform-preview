-- KFO Foundation / Tenant Layer migration 0001
-- Shared PostgreSQL tenancy. All tenant-facing authorization is deny-by-default.
create extension if not exists pgcrypto with schema extensions;

create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  display_name text not null check (length(trim(display_name)) between 2 and 160),
  tenant_access_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_domains (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hostname text not null unique check (
    hostname = lower(hostname) and hostname !~ '[^a-z0-9.-]' and
    hostname !~ '(^|\.)-' and hostname !~ '-(\.|$)' and
    hostname !~ '\.\.' and length(hostname) between 4 and 253
  ),
  domain_type text not null check (domain_type in ('kfo_subdomain', 'custom')),
  status text not null default 'verified' check (status in ('pending', 'verified', 'disabled')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  check ((status = 'verified' and verified_at is not null) or status <> 'verified')
);

create table public.organization_branches (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table public.organization_departments (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid,
  name text not null check (length(trim(name)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, branch_id)
    references public.organization_branches(organization_id, id) on delete restrict
);

create table public.organization_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  branch_id uuid,
  department_id uuid,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended', 'inactive')),
  joined_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, user_id),
  foreign key (organization_id, branch_id)
    references public.organization_branches(organization_id, id) on delete restrict,
  foreign key (organization_id, department_id)
    references public.organization_departments(organization_id, id) on delete restrict,
  check ((status = 'active' and joined_at is not null and ended_at is null) or status <> 'active'),
  check (status <> 'inactive' or ended_at is not null)
);

create table public.kfo_roles (
  code text primary key check (code in ('SA', 'CO', 'BM', 'EM', 'IN', 'TC', 'CQ', 'PA', 'FI', 'SU')),
  label text not null
);
insert into public.kfo_roles (code, label) values
  ('SA', 'Platform administrator'), ('CO', 'Company administrator'),
  ('BM', 'Branch or department manager'), ('EM', 'Employee'),
  ('IN', 'Trainer'), ('TC', 'Training center'), ('CQ', 'Quality reviewer'),
  ('PA', 'Partner administrator'), ('FI', 'Finance administrator'), ('SU', 'Individual user');

create table public.kfo_permissions (
  code text primary key,
  description text not null
);
insert into public.kfo_permissions (code, description) values
  ('organization.read', 'Read organization workspace data'),
  ('organization.settings.manage', 'Manage organization profile and settings'),
  ('organization.branding.manage', 'Manage controlled tenant branding'),
  ('domains.manage', 'Request or manage organization host aliases'),
  ('branches.manage', 'Manage organization branches'),
  ('departments.manage', 'Manage organization departments'),
  ('members.read', 'Read employees and membership state in assigned scope'),
  ('members.manage', 'Invite and manage organization memberships in assigned scope'),
  ('content.library.read', 'Read tenant learning library content within allowed scope'),
  ('content.library.manage', 'Manage tenant-owned or company-created library content'),
  ('assignments.manage', 'Manage training assignments in assigned scope'),
  ('reports.read', 'Read organization-scoped reports within assigned scope'),
  ('orders.read', 'Read organization order records'),
  ('invoices.read', 'Read organization invoice records'),
  ('seats.manage', 'Manage organization seat pools and assignments'),
  ('tenant.assets.read', 'Read authorized private tenant assets'),
  ('tenant.assets.manage', 'Create, update or delete private tenant assets'),
  ('audit.read', 'Read organization audit events');

create table public.kfo_role_permissions (
  role_code text not null references public.kfo_roles(code) on delete cascade,
  permission_code text not null references public.kfo_permissions(code) on delete cascade,
  primary key (role_code, permission_code)
);

-- Seed only source-supported company permissions. FI is intentionally not granted private content access.
-- Unresolved content-manager and organization lifecycle policies stay unimplemented/deny-by-default.
insert into public.kfo_role_permissions (role_code, permission_code)
select 'CO', code from public.kfo_permissions
where code in (
  'organization.read', 'organization.settings.manage', 'organization.branding.manage',
  'domains.manage', 'branches.manage', 'departments.manage', 'members.read', 'members.manage',
  'content.library.read', 'content.library.manage', 'assignments.manage', 'reports.read',
  'orders.read', 'invoices.read', 'seats.manage', 'tenant.assets.read', 'tenant.assets.manage', 'audit.read'
);
insert into public.kfo_role_permissions (role_code, permission_code) values
  ('BM', 'organization.read'), ('BM', 'members.read'), ('BM', 'content.library.read'),
  ('BM', 'assignments.manage'), ('BM', 'reports.read'), ('BM', 'tenant.assets.read'),
  ('FI', 'organization.read'), ('FI', 'orders.read'), ('FI', 'invoices.read');

create table public.membership_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null,
  membership_id uuid not null,
  role_code text not null references public.kfo_roles(code),
  branch_id uuid,
  department_id uuid,
  created_at timestamptz not null default now(),
  foreign key (organization_id, membership_id)
    references public.organization_memberships(organization_id, id) on delete cascade,
  foreign key (organization_id, branch_id)
    references public.organization_branches(organization_id, id) on delete restrict,
  foreign key (organization_id, department_id)
    references public.organization_departments(organization_id, id) on delete restrict
);
create index membership_roles_membership_idx on public.membership_roles(organization_id, membership_id);
create index memberships_user_org_idx on public.organization_memberships(user_id, organization_id, status);

create table public.tenant_branding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  portal_name text check (portal_name is null or length(trim(portal_name)) between 1 and 100),
  primary_color text not null default '#04180F' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#123B32' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_object_key text,
  cover_object_key text,
  welcome_copy text check (welcome_copy is null or length(welcome_copy) <= 1000),
  public_contact jsonb not null default '{}'::jsonb check (jsonb_typeof(public_contact) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check (logo_object_key is null or logo_object_key like organization_id::text || '/%'),
  check (cover_object_key is null or cover_object_key like organization_id::text || '/%')
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  occurred_at timestamptz not null default now(),
  scope jsonb not null default '{}'::jsonb,
  before_state jsonb,
  after_state jsonb
);
create index audit_events_org_time_idx on public.audit_events(organization_id, occurred_at desc);

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and exists (select 1 from public.organizations o where o.id = m.organization_id and o.tenant_access_enabled)
  );
$$;

create or replace function public.has_org_permission(
  p_organization_id uuid,
  p_permission text,
  p_branch_id uuid default null,
  p_department_id uuid default null
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr
      on mr.organization_id = m.organization_id and mr.membership_id = m.id
    join public.kfo_role_permissions rp on rp.role_code = mr.role_code
    join public.organizations o on o.id = m.organization_id and o.tenant_access_enabled
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and rp.permission_code = p_permission
      and (m.branch_id is null or (p_branch_id is not null and m.branch_id = p_branch_id))
      and (m.department_id is null or (p_department_id is not null and m.department_id = p_department_id))
      and (mr.branch_id is null or (p_branch_id is not null and mr.branch_id = p_branch_id))
      and (mr.department_id is null or (p_department_id is not null and mr.department_id = p_department_id))
  );
$$;

create or replace function public.try_uuid(p_value text)
returns uuid language plpgsql immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.resolve_tenant_host(p_hostname text)
returns table (
  organization_id uuid,
  tenant_slug text,
  display_name text,
  portal_name text,
  primary_color text,
  secondary_color text,
  welcome_copy text
)
language sql stable security definer
set search_path = ''
as $$
  select o.id, o.slug, o.display_name, b.portal_name, b.primary_color, b.secondary_color, b.welcome_copy
  from public.organization_domains d
  join public.organizations o on o.id = d.organization_id
  left join public.tenant_branding b on b.organization_id = o.id
  where d.hostname = lower(trim(trailing '.' from p_hostname))
    and d.status = 'verified'
    and o.tenant_access_enabled
  limit 1;
$$;

create or replace function public.request_custom_domain(p_organization_id uuid, p_hostname text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hostname text := lower(trim(trailing '.' from trim(p_hostname)));
  v_id uuid;
begin
  if not public.has_org_permission(p_organization_id, 'domains.manage') then
    raise exception 'organization domain permission required' using errcode = '42501';
  end if;
  if v_hostname !~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$' or v_hostname ~ '\.\.' or v_hostname ~ '(^|\.)-' or v_hostname ~ '-(\.|$)' then
    raise exception 'invalid hostname' using errcode = '22023';
  end if;
  if v_hostname = 'kfo.sa' or v_hostname like '%.kfo.sa' then
    raise exception 'KFO platform subdomains are reserved' using errcode = '22023';
  end if;
  insert into public.organization_domains (organization_id, hostname, domain_type, status)
  values (p_organization_id, v_hostname, 'custom', 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_organization(p_display_name text, p_slug text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_membership_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_slug !~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$' then
    raise exception 'invalid organization slug' using errcode = '22023';
  end if;
  if p_slug = any (array['www','api','app','admin','business','learn','partner','partners','auth','assets','static','status','support','mail','ftp','staging']) then
    raise exception 'reserved organization slug' using errcode = '22023';
  end if;
  insert into public.organizations (display_name, slug)
  values (trim(p_display_name), p_slug)
  returning id into v_organization_id;
  insert into public.organization_domains (organization_id, hostname, domain_type, status, verified_at)
  values (v_organization_id, p_slug || '.kfo.sa', 'kfo_subdomain', 'verified', now());
  insert into public.tenant_branding (organization_id) values (v_organization_id);
  insert into public.organization_memberships (organization_id, user_id, status, joined_at)
  values (v_organization_id, v_user_id, 'active', now())
  returning id into v_membership_id;
  insert into public.membership_roles (organization_id, membership_id, role_code)
  values (v_organization_id, v_membership_id, 'CO');
  return v_organization_id;
end;
$$;

create or replace function public.audit_tenant_row()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_org uuid;
  v_id text;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_org := coalesce((v_new->>'organization_id')::uuid, (v_old->>'organization_id')::uuid);
  if v_org is null then v_org := coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid); end if;
  v_id := coalesce(v_new->>'id', v_old->>'id', v_org::text);
  if v_org is not null then
    insert into public.audit_events (organization_id, actor_id, action, resource_type, resource_id, before_state, after_state)
    values (v_org, (select auth.uid()), lower(tg_op), tg_table_name, v_id, v_old, v_new);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger organizations_audit after insert or update or delete on public.organizations
for each row execute function public.audit_tenant_row();
create trigger organization_domains_audit after insert or update or delete on public.organization_domains
for each row execute function public.audit_tenant_row();
create trigger organization_memberships_audit after insert or update or delete on public.organization_memberships
for each row execute function public.audit_tenant_row();
create trigger membership_roles_audit after insert or update or delete on public.membership_roles
for each row execute function public.audit_tenant_row();
create trigger tenant_branding_audit after insert or update or delete on public.tenant_branding
for each row execute function public.audit_tenant_row();

alter table public.organizations enable row level security;
alter table public.organization_domains enable row level security;
alter table public.organization_branches enable row level security;
alter table public.organization_departments enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.kfo_roles enable row level security;
alter table public.kfo_permissions enable row level security;
alter table public.kfo_role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.tenant_branding enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_member_read on public.organizations for select to authenticated
using ((select public.is_org_member(id)));
create policy organizations_settings_update on public.organizations for update to authenticated
using ((select public.has_org_permission(id, 'organization.settings.manage')))
with check ((select public.has_org_permission(id, 'organization.settings.manage')));

create policy organization_domains_member_read on public.organization_domains for select to authenticated
using ((select public.is_org_member(organization_id)));
-- Alias verification is platform-controlled. Company admins may request, but cannot verify/claim a domain.

create policy branches_scoped_read on public.organization_branches for select to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.read', id, null)));
create policy branches_admin_read on public.organization_branches for select to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'branches.manage')));
create policy branches_insert on public.organization_branches for insert to authenticated
with check ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'branches.manage')));
create policy branches_update on public.organization_branches for update to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'branches.manage')))
with check ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'branches.manage')));
create policy branches_delete on public.organization_branches for delete to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'branches.manage')));

create policy departments_scoped_read on public.organization_departments for select to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.read', branch_id, id)));
create policy departments_admin_read on public.organization_departments for select to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'departments.manage')));
create policy departments_insert on public.organization_departments for insert to authenticated
with check ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'departments.manage')));
create policy departments_update on public.organization_departments for update to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'departments.manage')))
with check ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'departments.manage')));
create policy departments_delete on public.organization_departments for delete to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'departments.manage')));

create policy memberships_read_self_or_scoped on public.organization_memberships for select to authenticated
using (user_id = (select auth.uid()) or (select public.has_org_permission(organization_id, 'members.read', branch_id, department_id)));
create policy memberships_insert_invitation on public.organization_memberships for insert to authenticated
with check (status = 'invited' and (select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)));
create policy memberships_update_manage on public.organization_memberships for update to authenticated
using ((select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)))
with check ((select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)));

create policy roles_authenticated_read on public.kfo_roles for select to authenticated using (true);
create policy permissions_authenticated_read on public.kfo_permissions for select to authenticated using (true);
create policy role_permissions_authenticated_read on public.kfo_role_permissions for select to authenticated using (true);

create policy membership_roles_scoped_read on public.membership_roles for select to authenticated
using ((select public.has_org_permission(organization_id, 'members.read', branch_id, department_id)));
create policy membership_roles_insert_manage on public.membership_roles for insert to authenticated
with check (role_code in ('BM', 'EM', 'FI') and (select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)) and exists (select 1 from public.organization_memberships m where m.organization_id = membership_roles.organization_id and m.id = membership_roles.membership_id));
create policy membership_roles_update_manage on public.membership_roles for update to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)) and role_code in ('BM', 'EM', 'FI'))
with check (role_code in ('BM', 'EM', 'FI') and (select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)) and exists (select 1 from public.organization_memberships m where m.organization_id = membership_roles.organization_id and m.id = membership_roles.membership_id));
create policy membership_roles_delete_manage on public.membership_roles for delete to authenticated
using ((select public.is_org_member(organization_id)) and (select public.has_org_permission(organization_id, 'members.manage', branch_id, department_id)));

create policy tenant_branding_member_read on public.tenant_branding for select to authenticated
using ((select public.is_org_member(organization_id)));
create policy tenant_branding_manage on public.tenant_branding for all to authenticated
using ((select public.has_org_permission(organization_id, 'organization.branding.manage')))
with check ((select public.has_org_permission(organization_id, 'organization.branding.manage')));

create policy audit_events_scoped_read on public.audit_events for select to authenticated
using ((select public.has_org_permission(organization_id, 'audit.read')));

-- Explicit grants: RLS policies do not replace table grants.
revoke all on public.organizations, public.organization_domains, public.organization_branches,
  public.organization_departments, public.organization_memberships, public.kfo_roles,
  public.kfo_permissions, public.kfo_role_permissions, public.membership_roles,
  public.tenant_branding, public.audit_events from anon, authenticated;

grant select on public.organizations, public.organization_domains, public.organization_branches,
  public.organization_departments, public.organization_memberships, public.kfo_roles,
  public.kfo_permissions, public.kfo_role_permissions, public.membership_roles,
  public.tenant_branding, public.audit_events to authenticated;
grant update (display_name) on public.organizations to authenticated;
grant insert, update, delete on public.organization_branches,
  public.organization_departments to authenticated;
grant insert on public.organization_memberships to authenticated;
grant update (branch_id, department_id, status, joined_at, ended_at) on public.organization_memberships to authenticated;
grant insert, delete on public.membership_roles to authenticated;
grant update (role_code, branch_id, department_id) on public.membership_roles to authenticated;
grant insert, update, delete on public.tenant_branding to authenticated;
grant usage, select on sequence public.audit_events_id_seq to authenticated;
revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.has_org_permission(uuid, text, uuid, uuid) from public, anon;
revoke all on function public.try_uuid(text) from public, anon, authenticated;
revoke all on function public.resolve_tenant_host(text) from public;
revoke all on function public.create_organization(text, text) from public, anon;
revoke all on function public.request_custom_domain(uuid, text) from public, anon;
revoke all on function public.audit_tenant_row() from public, anon, authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_permission(uuid, text, uuid, uuid) to authenticated;
grant execute on function public.try_uuid(text) to authenticated;
grant execute on function public.resolve_tenant_host(text) to anon, authenticated;
-- Organization provisioning remains behind the approved onboarding/product flow; do not expose direct self-service creation yet.
grant execute on function public.request_custom_domain(uuid, text) to authenticated;
