-- Public tenant discovery exposes only approved portal fields.
-- The previous branding policy compared d.organization_id to itself, so
-- another organization's verified domain could satisfy its EXISTS clause.
drop policy if exists tenant_branding_public_portal_read on public.tenant_branding;

create policy tenant_branding_public_portal_read
on public.tenant_branding for select to anon
using (
  exists (
    select 1
    from public.organizations o
    join public.organization_domains d on d.organization_id = o.id
    where o.id = tenant_branding.organization_id
      and o.tenant_access_enabled
      and d.status = 'verified'
  )
);

-- Keep direct anonymous access limited to the fields used by the public
-- host resolver. RLS still controls which rows can be seen.
revoke all on table public.organizations from anon;
revoke all on table public.organization_domains from anon;
revoke all on table public.tenant_branding from anon;

grant select (id, slug, display_name, tenant_access_enabled)
  on public.organizations to anon;
grant select (organization_id, hostname, status)
  on public.organization_domains to anon;
grant select (organization_id, portal_name, primary_color, secondary_color, welcome_copy)
  on public.tenant_branding to anon;

-- Also enforce tenant access explicitly when the resolver is called by a
-- privileged server role that can bypass table RLS.
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
language sql stable
set search_path to ''
as $$
  select o.id, o.slug, o.display_name, b.portal_name,
         b.primary_color, b.secondary_color, b.welcome_copy
  from public.organization_domains d
  join public.organizations o on o.id = d.organization_id
  left join public.tenant_branding b on b.organization_id = o.id
  where d.hostname = lower(trim(trailing '.' from p_hostname))
    and d.status = 'verified'
    and o.tenant_access_enabled
  limit 1;
$$;
