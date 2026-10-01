-- Read-only role context. No caller-supplied user or organization identifiers.
-- Narrow private definer is required because EM cannot SELECT membership_roles.
-- Public wrapper remains invoker; mutations must still enforce their own RLS/RPC guards.
create or replace function private.my_access_context()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authenticated identity required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'membership_id', m.id,
      'organization_id', m.organization_id,
      'branch_id', m.branch_id,
      'department_id', m.department_id,
      'roles', coalesce((
        select jsonb_agg(jsonb_build_object(
          'code', mr.role_code,
          'branch_id', coalesce(m.branch_id, mr.branch_id),
          'department_id', coalesce(m.department_id, mr.department_id),
          'permissions', coalesce((
            select jsonb_agg(rp.permission_code order by rp.permission_code)
            from public.kfo_role_permissions rp where rp.role_code = mr.role_code
          ), '[]'::jsonb)
        ) order by mr.role_code, mr.id)
        from public.membership_roles mr
        where mr.membership_id = m.id and mr.organization_id = m.organization_id
          and (m.branch_id is null or mr.branch_id is null or m.branch_id = mr.branch_id)
          and (m.department_id is null or mr.department_id is null or m.department_id = mr.department_id)
      ), '[]'::jsonb)
    ) order by m.organization_id, m.id)
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id and o.tenant_access_enabled
    where m.user_id = v_user_id and m.status = 'active'
  ), '[]'::jsonb);
end;
$$;

revoke all on function private.my_access_context() from public, anon, authenticated;
grant execute on function private.my_access_context() to authenticated;

create or replace function public.my_access_context()
returns jsonb
language sql
stable
security invoker
set search_path to ''
as $$ select private.my_access_context(); $$;

revoke all on function public.my_access_context() from public, anon, authenticated;
grant execute on function public.my_access_context() to authenticated;
