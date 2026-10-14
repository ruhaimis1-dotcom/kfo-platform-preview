create function private.company_settings_snapshot(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  return jsonb_build_object(
    'branding',(select jsonb_build_object('portal_name',portal_name,'welcome_copy',welcome_copy,'primary_color',primary_color,'secondary_color',secondary_color) from public.tenant_branding where organization_id=p_organization_id),
    'domains',coalesce((select jsonb_agg(jsonb_build_object('hostname',hostname,'status',status) order by hostname) from public.organization_domains where organization_id=p_organization_id),'[]'::jsonb),
    'branches',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'status',status) order by name) from public.organization_branches where organization_id=p_organization_id),'[]'::jsonb),
    'departments',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'branch_id',branch_id,'status',status) order by name) from public.organization_departments where organization_id=p_organization_id),'[]'::jsonb),
    'activity',coalesce((select jsonb_agg(to_jsonb(a) order by occurred_at desc) from
      (select action,resource_type,occurred_at from public.audit_events where organization_id=p_organization_id order by occurred_at desc limit 50) a),'[]'::jsonb)
  );
end $$;
create function private.update_company_portal_text(p_organization_id uuid,p_portal_name text,p_welcome_copy text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_name text:=btrim(p_portal_name);v_copy text:=btrim(p_welcome_copy);
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  if v_name is null or char_length(v_name) not between 2 and 60 or v_name ~ '[[:cntrl:]]'
    or v_copy is null or char_length(v_copy)>180 or v_copy ~ '[[:cntrl:]]' then raise exception 'invalid portal text' using errcode='22023'; end if;
  insert into public.tenant_branding(organization_id,portal_name,welcome_copy,updated_by)
    values(p_organization_id,v_name,v_copy,auth.uid())
    on conflict(organization_id) do update set portal_name=excluded.portal_name,welcome_copy=excluded.welcome_copy,updated_by=auth.uid(),updated_at=now();
  return private.company_settings_snapshot(p_organization_id);
end $$;
create function private.create_company_structure_unit(p_organization_id uuid,p_kind text,p_name text,p_branch_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_name text:=btrim(p_name);v_id uuid;
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  if p_kind is null or p_kind not in ('branch','department') or v_name is null or char_length(v_name) not between 2 and 80 or v_name ~ '[[:cntrl:]]' then raise exception 'invalid structure unit' using errcode='22023'; end if;
  if p_kind='branch' and p_branch_id is not null then raise exception 'branch cannot have parent branch' using errcode='22023'; end if;
  if p_branch_id is not null and not exists(select 1 from public.organization_branches where id=p_branch_id and organization_id=p_organization_id and status='active') then raise exception 'branch outside company' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text||p_kind||lower(v_name)||coalesce(p_branch_id::text,''),2));
  if p_kind='branch' then
    select id into v_id from public.organization_branches where organization_id=p_organization_id and lower(btrim(name))=lower(v_name);
    if v_id is null then insert into public.organization_branches(organization_id,name) values(p_organization_id,v_name) returning id into v_id; end if;
  else
    select id into v_id from public.organization_departments where organization_id=p_organization_id and branch_id is not distinct from p_branch_id and lower(btrim(name))=lower(v_name);
    if v_id is null then insert into public.organization_departments(organization_id,branch_id,name) values(p_organization_id,p_branch_id,v_name) returning id into v_id; end if;
  end if;
  return v_id;
end $$;
revoke all on function private.company_settings_snapshot(uuid),private.update_company_portal_text(uuid,text,text),private.create_company_structure_unit(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function private.company_settings_snapshot(uuid),private.update_company_portal_text(uuid,text,text),private.create_company_structure_unit(uuid,text,text,uuid) to authenticated;
create function public.company_settings_snapshot(p_organization_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.company_settings_snapshot(p_organization_id); $$;
create function public.update_company_portal_text(p_organization_id uuid,p_portal_name text,p_welcome_copy text) returns jsonb language sql security invoker set search_path='' as $$ select private.update_company_portal_text(p_organization_id,p_portal_name,p_welcome_copy); $$;
create function public.create_company_structure_unit(p_organization_id uuid,p_kind text,p_name text,p_branch_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select private.create_company_structure_unit(p_organization_id,p_kind,p_name,p_branch_id); $$;
revoke all on function public.company_settings_snapshot(uuid),public.update_company_portal_text(uuid,text,text),public.create_company_structure_unit(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.company_settings_snapshot(uuid),public.update_company_portal_text(uuid,text,text),public.create_company_structure_unit(uuid,text,text,uuid) to authenticated;
