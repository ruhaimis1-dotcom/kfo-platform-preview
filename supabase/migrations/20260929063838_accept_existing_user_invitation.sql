-- Accept a membership that already names an existing Supabase Auth user.
-- Email-address invitation issuance/delivery is a separate workflow.
create or replace function private.accept_existing_user_invitation(
  p_membership_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_status text;
begin
  if v_user_id is null or p_membership_id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  select m.id, m.status into v_membership_id, v_status
  from public.organization_memberships m
  join public.organizations o
    on o.id = m.organization_id and o.tenant_access_enabled
  where m.id = p_membership_id
    and m.user_id = v_user_id
    and m.status in ('invited', 'active')
    and (
      m.status = 'active'
      or exists (
        select 1 from public.membership_roles mr
        where mr.organization_id = m.organization_id
          and mr.membership_id = m.id
      )
    )
  for update of m;

  if v_membership_id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  if v_status = 'invited' then
    update public.organization_memberships
    set status = 'active', joined_at = now(), ended_at = null
    where id = v_membership_id;
  end if;

  return v_membership_id;
end;
$$;

revoke all on function private.accept_existing_user_invitation(uuid)
  from public, anon, authenticated;
grant execute on function private.accept_existing_user_invitation(uuid)
  to authenticated;

-- Exposed RPC uses invoker rights and delegates the checked mutation to the
-- private function. No browser role receives table UPDATE privilege.
create or replace function public.accept_invitation(p_membership_id uuid)
returns uuid
language sql
security invoker
set search_path to ''
as $$
  select private.accept_existing_user_invitation(p_membership_id);
$$;

revoke all on function public.accept_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.accept_invitation(uuid)
  to authenticated;
