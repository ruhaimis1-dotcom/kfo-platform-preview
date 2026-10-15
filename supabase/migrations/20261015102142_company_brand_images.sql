-- Private images; immutable paths prevent replacement of a referenced object.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kfo-company-brand','kfo-company-brand',false,5242880,array['image/png','image/jpeg']);
create function private.company_brand_path_org(p_path text) returns uuid language plpgsql immutable security invoker set search_path='' as $$
begin
 if p_path is null or p_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(logo|cover)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg)$' then return null;end if;
 return split_part(p_path,'/',1)::uuid;
end $$;
revoke all on function private.company_brand_path_org(text) from public,anon,authenticated;
grant execute on function private.company_brand_path_org(text) to authenticated;
create policy kfo_brand_insert on storage.objects for insert to authenticated with check(bucket_id='kfo-company-brand' and private.can_manage_course_orders(private.company_brand_path_org(name)));
create policy kfo_brand_read on storage.objects for select to authenticated using(bucket_id='kfo-company-brand' and (private.can_manage_course_orders(private.company_brand_path_org(name)) or private.has_org_permission(private.company_brand_path_org(name),'tenant.assets.read')));
-- No UPDATE/DELETE policy: saved images cannot be overwritten or removed by another tab.
create function private.save_company_brand_image(p_organization_id uuid,p_kind text,p_object_key text,p_expected_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.tenant_branding%rowtype;obj jsonb;expected_mime text;max_size bigint;current_key text;
begin
 if auth.uid() is null or not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501';end if;
 if p_kind is null or p_kind not in ('logo','cover') then raise exception 'invalid image kind' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('company-brand-image:'||p_organization_id::text,0));
 select * into b from public.tenant_branding where organization_id=p_organization_id for update;
 current_key:=case p_kind when 'logo' then b.logo_object_key else b.cover_object_key end;
 if current_key is distinct from p_expected_key then raise exception 'company image changed' using errcode='40001';end if;
 if p_object_key is not null then
  if private.company_brand_path_org(p_object_key) is distinct from p_organization_id or split_part(p_object_key,'/',2)<>p_kind then raise exception 'invalid image path' using errcode='22023';end if;
  select metadata into obj from storage.objects where bucket_id='kfo-company-brand' and name=p_object_key;
  expected_mime:=case when right(p_object_key,4)='.png' then 'image/png' else 'image/jpeg' end;
  max_size:=case p_kind when 'logo' then 2097152 else 5242880 end;
  if obj is null or obj->>'mimetype' is distinct from expected_mime or coalesce(obj->>'size','') !~ '^[0-9]{1,10}$' then raise exception 'invalid uploaded image' using errcode='22023';end if;
  if (obj->>'size')::bigint<1 or (obj->>'size')::bigint>max_size then raise exception 'image too large' using errcode='22023';end if;
 end if;
 insert into public.tenant_branding(organization_id,logo_object_key,cover_object_key,updated_by)
 values(p_organization_id,case when p_kind='logo' then p_object_key end,case when p_kind='cover' then p_object_key end,auth.uid())
 on conflict(organization_id) do update set logo_object_key=case when p_kind='logo' then p_object_key else tenant_branding.logo_object_key end,cover_object_key=case when p_kind='cover' then p_object_key else tenant_branding.cover_object_key end,updated_by=auth.uid(),updated_at=now();
 return jsonb_build_object('kind',p_kind,'object_key',p_object_key);
end $$;
revoke all on function private.save_company_brand_image(uuid,text,text,text) from public,anon,authenticated;
grant execute on function private.save_company_brand_image(uuid,text,text,text) to authenticated;
create function public.save_company_brand_image(p_organization_id uuid,p_kind text,p_object_key text,p_expected_key text) returns jsonb language sql security invoker set search_path='' as $$select private.save_company_brand_image(p_organization_id,p_kind,p_object_key,p_expected_key);$$;
revoke all on function public.save_company_brand_image(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.save_company_brand_image(uuid,text,text,text) to authenticated;
create function private.company_brand_images(p_organization_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.can_manage_course_orders(p_organization_id) then raise exception 'company settings required' using errcode='42501';end if;
 return coalesce((select jsonb_build_object('logo',logo_object_key,'cover',cover_object_key) from public.tenant_branding where organization_id=p_organization_id),jsonb_build_object('logo',null,'cover',null));
end $$;
revoke all on function private.company_brand_images(uuid) from public,anon,authenticated;
grant execute on function private.company_brand_images(uuid) to authenticated;
create function public.company_brand_images(p_organization_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.company_brand_images(p_organization_id);$$;
revoke all on function public.company_brand_images(uuid) from public,anon,authenticated;
grant execute on function public.company_brand_images(uuid) to authenticated;
