create function private.admin_course_release_preview(p_release_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r private.course_release_snapshots%rowtype;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 select * into r from private.course_release_snapshots where id=p_release_id;
 if not found then raise exception 'release unavailable' using errcode='22023';end if;
 return jsonb_build_object('release_id',r.id,'course_slug',r.course_slug,'course_version',r.course_version,'metadata_revision',r.metadata_revision,'lesson_revision',r.lesson_revision,'runtime',r.runtime,'assessment',r.assessment,'status','prepared_for_review');
end $$;
revoke all on function private.admin_course_release_preview(uuid) from public,anon,authenticated;
grant execute on function private.admin_course_release_preview(uuid) to authenticated;
create function public.admin_course_release_preview(p_release_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.admin_course_release_preview(p_release_id);$$;
revoke all on function public.admin_course_release_preview(uuid) from public,anon,authenticated;
grant execute on function public.admin_course_release_preview(uuid) to authenticated;
