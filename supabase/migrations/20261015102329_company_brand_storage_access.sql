create function private.company_brand_access(p_path text,p_write boolean) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.company_brand_path_org(p_path) is not null and
 (private.can_manage_course_orders(private.company_brand_path_org(p_path)) or (not p_write and private.has_org_permission(private.company_brand_path_org(p_path),'tenant.assets.read')));
$$;
revoke all on function private.company_brand_access(text,boolean) from public,anon,authenticated;
grant execute on function private.company_brand_access(text,boolean) to authenticated;
drop policy kfo_brand_insert on storage.objects;
drop policy kfo_brand_read on storage.objects;
create policy kfo_brand_insert on storage.objects for insert to authenticated with check(bucket_id='kfo-company-brand' and private.company_brand_access(name,true));
create policy kfo_brand_read on storage.objects for select to authenticated using(bucket_id='kfo-company-brand' and private.company_brand_access(name,false));
