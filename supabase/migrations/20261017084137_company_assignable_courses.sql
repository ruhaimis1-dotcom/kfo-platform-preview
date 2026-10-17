create function private.company_assignable_courses(p_organization_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.organizations where id=p_organization_id and tenant_access_enabled) or not exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.status='active' and private.company_member_in_reviewer_scope(p_organization_id,m.id)) then raise exception 'company training access required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('course_slug',o.course_slug,'course_version',o.course_version,'title',o.title) order by o.title,o.course_version) from private.course_offers o join private.course_authoring a using(course_slug,course_version) where o.published and o.unit_amount_minor=0 and a.runtime_ready and ((o.course_slug='customer-service-reference' and o.course_version=1) or exists(select 1 from private.course_runtime_bindings b where b.course_slug=o.course_slug and b.course_version=o.course_version))),'[]'::jsonb);
end $$;
revoke all on function private.company_assignable_courses(uuid) from public,anon,authenticated;
grant execute on function private.company_assignable_courses(uuid) to authenticated;
create function public.company_assignable_courses(p_organization_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.company_assignable_courses(p_organization_id);$$;
revoke all on function public.company_assignable_courses(uuid) from public,anon,authenticated;
grant execute on function public.company_assignable_courses(uuid) to authenticated;
