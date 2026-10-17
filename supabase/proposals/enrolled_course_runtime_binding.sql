-- Bindings are written only by a future reviewed activation transaction.
create table private.course_runtime_bindings (
 course_slug text not null,course_version integer not null,release_id uuid not null unique references private.course_release_snapshots(id),
 primary key(course_slug,course_version),foreign key(course_slug,course_version) references private.course_offers(course_slug,course_version)
);
alter table private.course_runtime_bindings enable row level security;
revoke all on private.course_runtime_bindings from public,anon,authenticated;
create function private.my_course_release(p_enrollment_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare e public.learning_enrollments%rowtype;r private.course_release_snapshots%rowtype;
begin
 if auth.uid() is null then raise exception 'enrollment unavailable' using errcode='42501';end if;
 select * into e from public.learning_enrollments where id=p_enrollment_id and user_id=auth.uid() and status='active';
 if not found then raise exception 'enrollment unavailable' using errcode='42501';end if;
 if e.context_type='organization' and not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.id=e.membership_id and m.user_id=auth.uid() and m.organization_id=e.organization_id and m.status='active' and o.tenant_access_enabled) then raise exception 'enrollment unavailable' using errcode='42501';end if;
 select s.* into r from private.course_runtime_bindings b join private.course_release_snapshots s on s.id=b.release_id join private.course_offers o on o.course_slug=b.course_slug and o.course_version=b.course_version join private.course_authoring a on a.course_slug=b.course_slug and a.course_version=b.course_version where b.course_slug=e.course_slug and b.course_version=e.course_version and s.course_slug=b.course_slug and s.course_version=b.course_version and o.published and a.runtime_ready;
 if not found then raise exception 'course release unavailable' using errcode='22023';end if;
 return jsonb_build_object('status','enrolled_release','enrollment_id',e.id,'user_id',auth.uid(),'release_id',r.id,'course_slug',r.course_slug,'course_version',r.course_version,'metadata_revision',r.metadata_revision,'lesson_revision',r.lesson_revision,'runtime',r.runtime,'assessment',r.assessment);
end $$;
revoke all on function private.my_course_release(uuid) from public,anon,authenticated;
grant execute on function private.my_course_release(uuid) to authenticated;
create function public.my_course_release(p_enrollment_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.my_course_release(p_enrollment_id);$$;
revoke all on function public.my_course_release(uuid) from public,anon,authenticated;
grant execute on function public.my_course_release(uuid) to authenticated;
