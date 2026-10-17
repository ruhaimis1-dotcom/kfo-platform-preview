-- In-app invitation for an existing confirmed account; no email delivery.
create function private.invite_employee_by_email(p_organization_id uuid,p_email text) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid;m public.organization_memberships%rowtype;
begin
 if auth.uid() is null or not private.has_org_permission(p_organization_id,'members.manage') or p_email is null or length(btrim(p_email))>254 or btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invitation unavailable' using errcode='42501';end if;
 perform 1 from public.organizations where id=p_organization_id and tenant_access_enabled for update;
 if not found then raise exception 'invitation unavailable' using errcode='42501';end if;
 select id into u from auth.users where lower(email)=lower(btrim(p_email)) and email_confirmed_at is not null;
 if not found then raise exception 'invitation unavailable' using errcode='42501';end if;
 select * into m from public.organization_memberships where organization_id=p_organization_id and user_id=u;
 if found then
  if m.status='invited' and exists(select 1 from public.membership_roles where membership_id=m.id and organization_id=p_organization_id and role_code='EM') then return m.id;end if;
  raise exception 'invitation unavailable' using errcode='42501';
 end if;
 return private.invite_existing_employee(p_organization_id,u);
end $$;
revoke all on function private.invite_employee_by_email(uuid,text) from public,anon,authenticated;
grant execute on function private.invite_employee_by_email(uuid,text) to authenticated;
create function public.invite_employee_by_email(p_organization_id uuid,p_email text) returns uuid language sql security invoker set search_path='' as $$select private.invite_employee_by_email(p_organization_id,p_email);$$;
revoke all on function public.invite_employee_by_email(uuid,text) from public,anon,authenticated;
grant execute on function public.invite_employee_by_email(uuid,text) to authenticated;
