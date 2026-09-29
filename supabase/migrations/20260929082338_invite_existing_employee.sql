-- Atomically invite an existing Auth user as an unscoped employee.
-- Email delivery, pending identities, and team assignment are separate slices.
create or replace function private.invite_existing_employee(
  p_organization_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id uuid;
begin
  if p_organization_id is null or p_user_id is null or auth.uid() is null
    or not private.has_org_permission(p_organization_id, 'members.manage') then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  -- Lock the enabled tenant while checking identity and uniqueness. Returning
  -- the same generic error avoids revealing who has an Auth account.
  perform 1 from public.organizations
    where id = p_organization_id and tenant_access_enabled for update;
  if not found or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  insert into public.organization_memberships (organization_id, user_id, status)
  values (p_organization_id, p_user_id, 'invited')
  on conflict (organization_id, user_id) do nothing
  returning id into v_id;
  if v_id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  insert into public.membership_roles (organization_id, membership_id, role_code)
  values (p_organization_id, v_id, 'EM');
  return v_id;
end;
$$;

revoke all on function private.invite_existing_employee(uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.invite_existing_employee(uuid,uuid)
  to authenticated;

create or replace function public.invite_existing_employee(
  p_organization_id uuid,
  p_user_id uuid
)
returns uuid
language sql
security invoker
set search_path to ''
as $$
  select private.invite_existing_employee(p_organization_id, p_user_id);
$$;

revoke all on function public.invite_existing_employee(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.invite_existing_employee(uuid,uuid)
  to authenticated;
