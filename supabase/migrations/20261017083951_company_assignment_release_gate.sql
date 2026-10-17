-- Assignment availability must match the free pilot/payment boundary.
create or replace function public.assign_company_course(
  p_organization_id uuid,
  p_membership_ids uuid[],
  p_course_slug text,
  p_course_version integer,
  p_due_at timestamptz default null
) returns table(enrollment_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path to ''
as $assign_company$
declare
  v_uid uuid := auth.uid();
  v_membership uuid;
  v_user uuid;
  v_enrollment uuid;
  v_created boolean;
begin
  if v_uid is null then
    raise exception 'authenticated identity required' using errcode = '42501';
  end if;
  if p_course_slug is null
     or p_course_slug !~ '^[a-z0-9-]+$'
     or p_course_version <= 0
     or coalesce(cardinality(p_membership_ids),0) = 0 then
    raise exception 'invalid assignment request' using errcode = '22023';
  end if;
  if p_due_at is not null and p_due_at <= now() then
    raise exception 'invalid due date' using errcode = '22023';
  end if;
  -- Free pilot only: never assign unpublished or priced offers without entitlement.
  perform 1 from private.course_offers o
  join private.course_authoring a using(course_slug,course_version)
  where o.course_slug=p_course_slug and o.course_version=p_course_version
    and o.published and o.unit_amount_minor=0 and a.runtime_ready
    and ((o.course_slug='customer-service-reference' and o.course_version=1)
      or exists(select 1 from private.course_runtime_bindings b
        where b.course_slug=o.course_slug and b.course_version=o.course_version))
  for share of o,a;
  if not found then raise exception 'course unavailable for assignment' using errcode='22023';end if;

  if not exists(
    select 1
    from public.course_activities a
    where a.course_slug = p_course_slug
      and a.course_version = p_course_version
  ) then
    raise exception 'course unavailable' using errcode = '22023';
  end if;

  foreach v_membership in array p_membership_ids loop
    v_enrollment := null;
    v_created := false;
    if not private.company_member_in_reviewer_scope(p_organization_id, v_membership) then
      raise exception 'member outside assignment scope' using errcode = '42501';
    end if;

    select user_id into v_user
    from public.organization_memberships
    where id = v_membership
      and organization_id = p_organization_id
      and status = 'active';

    if v_user is null then
      raise exception 'member unavailable' using errcode = '42501';
    end if;

    insert into public.learning_enrollments(
      user_id, context_type, organization_id, membership_id,
      course_slug, course_version, source, due_at, status
    ) values (
      v_user, 'organization', p_organization_id, v_membership,
      p_course_slug, p_course_version, 'organization', p_due_at, 'active'
    )
    on conflict do nothing
    returning id into v_enrollment;

    v_created := v_enrollment is not null;
    if v_enrollment is null then
      select e.id into v_enrollment
      from public.learning_enrollments e
      where e.user_id = v_user
        and e.organization_id = p_organization_id
        and e.membership_id = v_membership
        and e.course_slug = p_course_slug
        and e.course_version = p_course_version
        and e.context_type = 'organization'
        and e.status <> 'cancelled'
      limit 1;
    end if;

    if v_created then
      insert into public.learner_notifications(
        user_id, kind, title, body, enrollment_id
      ) values (
        v_user,
        'assignment',
        'تم تكليفك بدورة جديدة',
        'أضيف تدريب جديد إلى تعلمك الوظيفي في كفو.',
        v_enrollment
      );
    end if;

    enrollment_id := v_enrollment;
    membership_id := v_membership;
    return next;
  end loop;
end
$assign_company$;

revoke all on function public.assign_company_course(uuid,uuid[],text,integer,timestamptz)
from public, anon;
grant execute on function public.assign_company_course(uuid,uuid[],text,integer,timestamptz)
to authenticated;
