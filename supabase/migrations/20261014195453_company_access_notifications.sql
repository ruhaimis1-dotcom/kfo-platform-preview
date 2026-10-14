create table private.company_notification_preferences(
  organization_id uuid primary key references public.organizations(id),
  assignment_enabled boolean not null default true,certificate_enabled boolean not null default true,
  updated_at timestamptz not null default now(),updated_by uuid references auth.users(id)
);
alter table private.company_notification_preferences enable row level security;
revoke all on private.company_notification_preferences from public,anon,authenticated;

create function private.company_access_settings(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  return jsonb_build_object(
    'members',coalesce((select jsonb_agg(jsonb_build_object('membership_id',m.id,'display_name',coalesce(nullif(lp.display_name,''),u.email,'عضو الشركة'),
      'status',m.status,'branch_id',m.branch_id,'department_id',m.department_id,
      'is_self',m.user_id=auth.uid(),'roles',coalesce((select jsonb_agg(r.role_code order by r.role_code) from public.membership_roles r where r.membership_id=m.id and r.organization_id=m.organization_id),'[]'::jsonb)) order by m.created_at)
      from public.organization_memberships m join auth.users u on u.id=m.user_id left join public.learner_profiles lp on lp.user_id=m.user_id where m.organization_id=p_organization_id),'[]'::jsonb),
    'notifications',coalesce((select jsonb_build_object('assignment_enabled',assignment_enabled,'certificate_enabled',certificate_enabled) from private.company_notification_preferences where organization_id=p_organization_id),jsonb_build_object('assignment_enabled',true,'certificate_enabled',true))
  );
end $$;

create function private.update_company_member_role(p_organization_id uuid,p_membership_id uuid,p_role text,p_expected_role text,p_branch_id uuid default null,p_department_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_member public.organization_memberships%rowtype;v_roles text[];v_dept_branch uuid;
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  if p_role is null or p_role not in ('CO','BM','EM') then raise exception 'unsupported company role' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text,3));
  select * into v_member from public.organization_memberships where id=p_membership_id and organization_id=p_organization_id for update;
  if not found or v_member.status<>'active' or v_member.user_id=auth.uid() then raise exception 'membership change unavailable' using errcode='42501'; end if;
  select array_agg(role_code order by role_code) into v_roles from public.membership_roles where organization_id=p_organization_id and membership_id=p_membership_id;
  if cardinality(v_roles) is distinct from 1 or v_roles[1] not in ('CO','BM','EM') then raise exception 'protected membership roles' using errcode='42501'; end if;
  if v_roles[1] is distinct from p_expected_role then raise exception 'membership changed; reload' using errcode='40001'; end if;
  if p_role='CO' and (p_branch_id is not null or p_department_id is not null) then raise exception 'company owner cannot be scoped' using errcode='22023'; end if;
  if p_role='BM' and p_branch_id is null and p_department_id is null then raise exception 'manager scope required' using errcode='22023'; end if;
  if p_branch_id is not null and not exists(select 1 from public.organization_branches where id=p_branch_id and organization_id=p_organization_id and status='active') then raise exception 'foreign branch' using errcode='42501'; end if;
  if p_department_id is not null then
    select branch_id into v_dept_branch from public.organization_departments where id=p_department_id and organization_id=p_organization_id and status='active';
    if not found or (v_dept_branch is not null and v_dept_branch is distinct from p_branch_id) then raise exception 'foreign department or branch mismatch' using errcode='42501'; end if;
  end if;
  if v_roles[1]='CO' and p_role<>'CO' and not exists(
    select 1 from public.organization_memberships m join public.membership_roles r on r.membership_id=m.id and r.organization_id=m.organization_id
    where m.organization_id=p_organization_id and m.id<>p_membership_id and m.status='active' and r.role_code='CO'
  ) then raise exception 'last company owner required' using errcode='42501'; end if;
  update public.organization_memberships set branch_id=p_branch_id,department_id=p_department_id where id=p_membership_id and organization_id=p_organization_id;
  update public.membership_roles set role_code=p_role,branch_id=p_branch_id,department_id=p_department_id
    where organization_id=p_organization_id and membership_id=p_membership_id;
  return private.company_access_settings(p_organization_id);
end $$;

create function private.update_company_notification_preferences(p_organization_id uuid,p_assignment_enabled boolean,p_certificate_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  if p_assignment_enabled is null or p_certificate_enabled is null then raise exception 'invalid preferences' using errcode='22023'; end if;
  insert into private.company_notification_preferences(organization_id,assignment_enabled,certificate_enabled,updated_by)
    values(p_organization_id,p_assignment_enabled,p_certificate_enabled,auth.uid()) on conflict(organization_id) do update
    set assignment_enabled=excluded.assignment_enabled,certificate_enabled=excluded.certificate_enabled,updated_by=auth.uid(),updated_at=now();
  insert into public.audit_events(organization_id,actor_id,action,resource_type,resource_id,after_state)
    values(p_organization_id,auth.uid(),'update_notification_preferences','notification_preferences',p_organization_id::text,jsonb_build_object('assignment_enabled',p_assignment_enabled,'certificate_enabled',p_certificate_enabled));
  return private.company_access_settings(p_organization_id);
end $$;

-- Preferences affect new in-app learning notifications, never learning access or old history.
create function private.apply_company_notification_preferences() returns trigger language plpgsql security definer set search_path='' as $$
declare v_org uuid;v_enabled boolean;
begin
  if new.enrollment_id is null or new.kind not in ('assignment','certificate') then return new; end if;
  select organization_id into v_org from public.learning_enrollments where id=new.enrollment_id and context_type='organization' and user_id=new.user_id;
  if v_org is null then return new; end if;
  select case when new.kind='assignment' then assignment_enabled else certificate_enabled end into v_enabled from private.company_notification_preferences where organization_id=v_org;
  if v_enabled=false then return null; end if;
  return new;
end $$;
revoke all on function private.apply_company_notification_preferences() from public,anon,authenticated;
create trigger apply_company_notification_preferences before insert on public.learner_notifications for each row execute function private.apply_company_notification_preferences();

revoke all on function private.company_access_settings(uuid),private.update_company_member_role(uuid,uuid,text,text,uuid,uuid),private.update_company_notification_preferences(uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function private.company_access_settings(uuid),private.update_company_member_role(uuid,uuid,text,text,uuid,uuid),private.update_company_notification_preferences(uuid,boolean,boolean) to authenticated;
create function public.company_access_settings(p_organization_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.company_access_settings(p_organization_id);$$;
create function public.update_company_member_role(p_organization_id uuid,p_membership_id uuid,p_role text,p_expected_role text,p_branch_id uuid default null,p_department_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select private.update_company_member_role(p_organization_id,p_membership_id,p_role,p_expected_role,p_branch_id,p_department_id);$$;
create function public.update_company_notification_preferences(p_organization_id uuid,p_assignment_enabled boolean,p_certificate_enabled boolean) returns jsonb language sql security invoker set search_path='' as $$select private.update_company_notification_preferences(p_organization_id,p_assignment_enabled,p_certificate_enabled);$$;
revoke all on function public.company_access_settings(uuid),public.update_company_member_role(uuid,uuid,text,text,uuid,uuid),public.update_company_notification_preferences(uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.company_access_settings(uuid),public.update_company_member_role(uuid,uuid,text,text,uuid,uuid),public.update_company_notification_preferences(uuid,boolean,boolean) to authenticated;
