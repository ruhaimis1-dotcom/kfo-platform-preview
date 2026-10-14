-- Admin onboarding. Owner must have an existing confirmed KFO account.
-- Existing row triggers audit each insert atomically with this transaction.
create or replace function private.admin_create_organization(
  p_display_name text, p_slug text, p_owner_email text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(p_display_name);
  v_slug text := lower(btrim(p_slug));
  v_email text := lower(btrim(p_owner_email));
  v_owner uuid;
  v_org uuid;
  v_membership uuid;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 120
    or v_name ~ '[[:cntrl:]]' or v_slug is null
    or v_slug !~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'
    or v_slug = any(array['www','api','app','admin','business','learn','partner','partners','auth','assets','static','status','support','mail','ftp','staging'])
    or v_email is null or char_length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid organization details' using errcode='22023';
  end if;
  select u.id into v_owner from auth.users u
    where lower(u.email)=v_email and u.email_confirmed_at is not null
      and u.deleted_at is null and (u.banned_until is null or u.banned_until < now());
  if v_owner is null then
    raise exception 'confirmed owner account required' using errcode='22023';
  end if;
  insert into public.organizations(display_name,slug) values(v_name,v_slug) returning id into v_org;
  insert into public.tenant_branding(organization_id) values(v_org);
  -- Register the requested host, without claiming DNS/hosting is ready.
  insert into public.organization_domains(organization_id,hostname,domain_type,status)
    values(v_org,v_slug||'.kfo.sa','kfo_subdomain','pending');
  insert into public.organization_memberships(organization_id,user_id,status,joined_at)
    values(v_org,v_owner,'active',now()) returning id into v_membership;
  insert into public.membership_roles(organization_id,membership_id,role_code)
    values(v_org,v_membership,'CO');
  return v_org;
end $$;
revoke all on function private.admin_create_organization(text,text,text) from public,anon,authenticated;
grant execute on function private.admin_create_organization(text,text,text) to authenticated;
create or replace function public.admin_create_organization(p_display_name text,p_slug text,p_owner_email text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.admin_create_organization(p_display_name,p_slug,p_owner_email);
$$;
revoke all on function public.admin_create_organization(text,text,text) from public,anon,authenticated;
grant execute on function public.admin_create_organization(text,text,text) to authenticated;
