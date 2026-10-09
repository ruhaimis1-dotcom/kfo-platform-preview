-- Narrow D6 setting: only the company owner may rename the organization.
create or replace function private.update_company_display_name(
  p_organization_id uuid,
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_name text := btrim(p_display_name);
begin
  if p_organization_id is null or auth.uid() is null
    or not private.has_org_permission(
      p_organization_id, 'organization.settings.manage'
    ) then
    raise exception 'company settings unavailable' using errcode = '42501';
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120
    or v_name ~ '[[:cntrl:]]' then
    raise exception 'invalid company name' using errcode = '22023';
  end if;

  update public.organizations o
  set display_name = v_name, updated_at = now()
  where o.id = p_organization_id and o.display_name is distinct from v_name;

  return v_name;
end;
$$;

revoke all on function private.update_company_display_name(uuid,text)
  from public, anon, authenticated;
grant execute on function private.update_company_display_name(uuid,text)
  to authenticated;

create or replace function public.update_company_display_name(
  p_organization_id uuid,
  p_display_name text
)
returns text
language sql
security invoker
set search_path to ''
as $$
  select private.update_company_display_name(p_organization_id, p_display_name);
$$;

revoke all on function public.update_company_display_name(uuid,text)
  from public, anon, authenticated;
grant execute on function public.update_company_display_name(uuid,text)
  to authenticated;
