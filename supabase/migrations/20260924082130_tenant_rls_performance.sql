-- Clear duplicate SELECT policies and cover tenant foreign keys identified by Supabase advisors.
drop policy branches_admin_read on public.organization_branches;
drop policy branches_scoped_read on public.organization_branches;
create policy branches_read on public.organization_branches for select to authenticated
using (
  (select private.is_org_member(organization_id)) and (
    (select private.has_org_permission(organization_id, 'branches.manage')) or
    (select private.has_org_permission(organization_id, 'members.read', id, null))
  )
);

drop policy departments_admin_read on public.organization_departments;
drop policy departments_scoped_read on public.organization_departments;
create policy departments_read on public.organization_departments for select to authenticated
using (
  (select private.is_org_member(organization_id)) and (
    (select private.has_org_permission(organization_id, 'departments.manage')) or
    (select private.has_org_permission(organization_id, 'members.read', branch_id, id))
  )
);

drop policy tenant_branding_manage on public.tenant_branding;
create policy tenant_branding_insert on public.tenant_branding for insert to authenticated
with check ((select private.has_org_permission(organization_id, 'organization.branding.manage')));
create policy tenant_branding_update on public.tenant_branding for update to authenticated
using ((select private.has_org_permission(organization_id, 'organization.branding.manage')))
with check ((select private.has_org_permission(organization_id, 'organization.branding.manage')));
create policy tenant_branding_delete on public.tenant_branding for delete to authenticated
using ((select private.has_org_permission(organization_id, 'organization.branding.manage')));

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists role_permissions_permission_idx on public.kfo_role_permissions(permission_code);
create index if not exists membership_roles_branch_idx on public.membership_roles(organization_id, branch_id);
create index if not exists membership_roles_department_idx on public.membership_roles(organization_id, department_id);
create index if not exists membership_roles_role_idx on public.membership_roles(role_code);
create index if not exists departments_branch_idx on public.organization_departments(organization_id, branch_id);
create index if not exists memberships_branch_idx on public.organization_memberships(organization_id, branch_id);
create index if not exists memberships_department_idx on public.organization_memberships(organization_id, department_id);
create index if not exists tenant_branding_updated_by_idx on public.tenant_branding(updated_by);
