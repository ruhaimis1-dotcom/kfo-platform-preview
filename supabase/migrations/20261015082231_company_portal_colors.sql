-- Accessible company portal colors; no asset upload or permissions change.
create function private.brand_white_contrast(p_color text) returns numeric language plpgsql immutable security invoker set search_path='' as $$
declare channel numeric;lum numeric:=0;i integer;weight numeric;
begin
 if p_color is null or p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'invalid color' using errcode='22023';end if;
 for i in 0..2 loop
  channel:=(('x'||substr(p_color,2+i*2,2))::bit(8)::integer)::numeric/255;
  if channel<=0.04045 then channel:=channel/12.92;else channel:=power((channel+0.055)/1.055,2.4);end if;
  weight:=case i when 0 then 0.2126 when 1 then 0.7152 else 0.0722 end;lum:=lum+channel*weight;
 end loop;
 return 1.05/(lum+0.05);
end $$;
revoke all on function private.brand_white_contrast(text) from public,anon,authenticated;
create function private.update_company_portal_colors(p_organization_id uuid,p_primary text,p_secondary text,p_expected_primary text,p_expected_secondary text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.tenant_branding%rowtype;
begin
 if auth.uid() is null or not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501';end if;
 if private.brand_white_contrast(p_primary)<4.5 or private.brand_white_contrast(p_secondary)<4.5 or p_expected_primary is null or p_expected_primary !~ '^#[0-9A-Fa-f]{6}$' or p_expected_secondary is null or p_expected_secondary !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'colors require readable white text' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('company-brand-colors:'||p_organization_id::text,0));
 select * into b from public.tenant_branding where organization_id=p_organization_id for update;
 if upper(coalesce(b.primary_color,'#04180F'))<>upper(p_expected_primary) or upper(coalesce(b.secondary_color,'#123B32'))<>upper(p_expected_secondary) then raise exception 'company colors changed' using errcode='40001';end if;
 insert into public.tenant_branding(organization_id,primary_color,secondary_color,updated_by) values(p_organization_id,upper(p_primary),upper(p_secondary),auth.uid())
 on conflict(organization_id) do update set primary_color=excluded.primary_color,secondary_color=excluded.secondary_color,updated_by=auth.uid(),updated_at=now();
 return private.company_settings_snapshot(p_organization_id);
end $$;
revoke all on function private.update_company_portal_colors(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function private.update_company_portal_colors(uuid,text,text,text,text) to authenticated;
create function public.update_company_portal_colors(p_organization_id uuid,p_primary text,p_secondary text,p_expected_primary text,p_expected_secondary text) returns jsonb language sql security invoker set search_path='' as $$select private.update_company_portal_colors(p_organization_id,p_primary,p_secondary,p_expected_primary,p_expected_secondary);$$;
revoke all on function public.update_company_portal_colors(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.update_company_portal_colors(uuid,text,text,text,text) to authenticated;
