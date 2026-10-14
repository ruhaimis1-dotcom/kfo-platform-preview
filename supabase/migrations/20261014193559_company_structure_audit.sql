create or replace function private.create_company_structure_unit(p_organization_id uuid,p_kind text,p_name text,p_branch_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_name text:=btrim(p_name);v_id uuid;v_created boolean:=false;
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501'; end if;
  if p_kind is null or p_kind not in ('branch','department') or v_name is null or char_length(v_name) not between 2 and 80 or v_name ~ '[[:cntrl:]]' then raise exception 'invalid structure unit' using errcode='22023'; end if;
  if p_kind='branch' and p_branch_id is not null then raise exception 'branch cannot have parent branch' using errcode='22023'; end if;
  if p_branch_id is not null and not exists(select 1 from public.organization_branches where id=p_branch_id and organization_id=p_organization_id and status='active') then raise exception 'branch outside company' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text||p_kind||lower(v_name)||coalesce(p_branch_id::text,''),2));
  if p_kind='branch' then
    select id into v_id from public.organization_branches where organization_id=p_organization_id and lower(btrim(name))=lower(v_name);
    if v_id is null then insert into public.organization_branches(organization_id,name) values(p_organization_id,v_name) returning id into v_id;v_created:=true; end if;
  else
    select id into v_id from public.organization_departments where organization_id=p_organization_id and branch_id is not distinct from p_branch_id and lower(btrim(name))=lower(v_name);
    if v_id is null then insert into public.organization_departments(organization_id,branch_id,name) values(p_organization_id,p_branch_id,v_name) returning id into v_id;v_created:=true; end if;
  end if;
  if v_created then
    insert into public.audit_events(organization_id,actor_id,action,resource_type,resource_id,after_state)
      values(p_organization_id,auth.uid(),'create_structure_unit',p_kind,v_id::text,jsonb_build_object('name',v_name,'branch_id',p_branch_id));
  end if;
  return v_id;
end $$;
