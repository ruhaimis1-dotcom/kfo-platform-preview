-- Applied migration: Company Portal MVP contract. Supabase version 20261007165658.
-- KFO Company Portal MVP proposal.
-- REVIEW ONLY. Depends on unified_learner_context.sql + intelligent_course_engine.sql.
-- No Deploy Until MVP Gate.
--
-- Design rule:
-- - Organization assignments are organization-context rows in learning_enrollments.
-- - Personal learning is never exposed by company RPCs.
-- - CO has organization scope; BM is limited to effective branch/department scope.
-- - SA may support all organizations.
-- - Browser clients do not receive broad table mutation grants.

create or replace function private.company_member_in_reviewer_scope(
  p_organization_id uuid,
  p_target_membership_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $company_scope$
declare
  v_uid uuid := auth.uid();
  v_target public.organization_memberships%rowtype;
begin
  if v_uid is null then return false; end if;

  select * into v_target
  from public.organization_memberships
  where id = p_target_membership_id
    and organization_id = p_organization_id
    and status = 'active';

  if not found then return false; end if;

  -- Platform admin support.
  if exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles r
      on r.membership_id = m.id and r.organization_id = m.organization_id
    where m.user_id = v_uid
      and m.status = 'active'
      and r.role_code = 'SA'
  ) then return true; end if;

  -- Company admin sees the whole organization.
  if exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles r
      on r.membership_id = m.id and r.organization_id = m.organization_id
    where m.user_id = v_uid
      and m.status = 'active'
      and m.organization_id = p_organization_id
      and r.role_code = 'CO'
  ) then return true; end if;

  -- Branch/department manager sees only their effective scope.
  return exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles r
      on r.membership_id = m.id and r.organization_id = m.organization_id
    where m.user_id = v_uid
      and m.status = 'active'
      and m.organization_id = p_organization_id
      and r.role_code = 'BM'
      and (
        coalesce(m.branch_id, r.branch_id) is null
        or coalesce(m.branch_id, r.branch_id) = v_target.branch_id
      )
      and (
        coalesce(m.department_id, r.department_id) is null
        or coalesce(m.department_id, r.department_id) = v_target.department_id
      )
  );
end
$company_scope$;

revoke all on function private.company_member_in_reviewer_scope(uuid,uuid)
from public, anon, authenticated;


create or replace function public.my_company_portal_context(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $company_context$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_membership uuid;
  v_roles jsonb;
begin
  if v_uid is null then
    raise exception 'authenticated identity required' using errcode = '42501';
  end if;

  select m.id, o.display_name,
    coalesce(jsonb_agg(distinct r.role_code) filter (where r.role_code in ('CO','BM','SA')), '[]'::jsonb)
  into v_membership, v_name, v_roles
  from public.organization_memberships m
  join public.organizations o
    on o.id = m.organization_id and o.tenant_access_enabled
  join public.membership_roles r
    on r.membership_id = m.id and r.organization_id = m.organization_id
  where m.user_id = v_uid
    and m.status = 'active'
    and m.organization_id = p_organization_id
    and r.role_code in ('CO','BM','SA')
  group by m.id, o.display_name
  limit 1;

  if v_membership is null then
    -- SA can support an organization without holding an org-local role row.
    if exists (
      select 1
      from public.organization_memberships sm
      join public.membership_roles sr
        on sr.membership_id = sm.id and sr.organization_id = sm.organization_id
      where sm.user_id = v_uid and sm.status = 'active' and sr.role_code = 'SA'
    ) then
      select display_name into v_name
      from public.organizations
      where id = p_organization_id and tenant_access_enabled;
      if v_name is null then
        raise exception 'organization unavailable' using errcode = '42501';
      end if;
      return jsonb_build_object(
        'organization_id', p_organization_id,
        'organization_name', v_name,
        'membership_id', null,
        'roles', jsonb_build_array('SA')
      );
    end if;
    raise exception 'company portal unavailable' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'organization_name', v_name,
    'membership_id', v_membership,
    'roles', v_roles
  );
end
$company_context$;

revoke all on function public.my_company_portal_context(uuid) from public, anon;
grant execute on function public.my_company_portal_context(uuid) to authenticated;


create or replace function public.company_member_directory(p_organization_id uuid)
returns table(
  membership_id uuid,
  user_id uuid,
  branch_id uuid,
  department_id uuid,
  membership_status text,
  display_name text,
  headline text
)
language sql
stable
security definer
set search_path to ''
as $company_members$
  select
    m.id,
    m.user_id,
    m.branch_id,
    m.department_id,
    m.status,
    lp.display_name,
    lp.headline
  from public.organization_memberships m
  left join public.learner_profiles lp on lp.user_id = m.user_id
  where m.organization_id = p_organization_id
    and private.company_member_in_reviewer_scope(p_organization_id, m.id)
  order by coalesce(lp.display_name, m.user_id::text), m.id;
$company_members$;

revoke all on function public.company_member_directory(uuid) from public, anon;
grant execute on function public.company_member_directory(uuid) to authenticated;


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


create or replace function public.company_training_dashboard(p_organization_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $company_dashboard$
with scoped_members as (
  select m.id
  from public.organization_memberships m
  where m.organization_id = p_organization_id
    and m.status = 'active'
    and private.company_member_in_reviewer_scope(p_organization_id, m.id)
),
scoped_enrollments as (
  select e.*
  from public.learning_enrollments e
  join scoped_members sm on sm.id = e.membership_id
  where e.organization_id = p_organization_id
    and e.context_type = 'organization'
    and e.source = 'organization'
    and e.status <> 'cancelled'
)
select jsonb_build_object(
  'active_members', (select count(*) from scoped_members),
  'assignments', (select count(*) from scoped_enrollments),
  'active_assignments', (select count(*) from scoped_enrollments where status = 'active'),
  'completed_assignments', (select count(*) from scoped_enrollments where status = 'completed'),
  'due_within_7_days', (
    select count(*) from scoped_enrollments
    where status = 'active'
      and due_at is not null
      and due_at >= now()
      and due_at < now() + interval '7 days'
  )
);
$company_dashboard$;

revoke all on function public.company_training_dashboard(uuid) from public, anon;
grant execute on function public.company_training_dashboard(uuid) to authenticated;


create or replace function public.company_training_report(p_organization_id uuid)
returns table(
  course_slug text,
  course_version integer,
  total_assignments bigint,
  active_assignments bigint,
  completed_assignments bigint
)
language sql
stable
security definer
set search_path to ''
as $company_report$
  select
    e.course_slug,
    e.course_version,
    count(*) as total_assignments,
    count(*) filter (where e.status = 'active') as active_assignments,
    count(*) filter (where e.status = 'completed') as completed_assignments
  from public.learning_enrollments e
  where e.organization_id = p_organization_id
    and e.context_type = 'organization'
    and e.source = 'organization'
    and e.status <> 'cancelled'
    and private.company_member_in_reviewer_scope(p_organization_id, e.membership_id)
  group by e.course_slug, e.course_version
  order by count(*) desc, e.course_slug, e.course_version;
$company_report$;

revoke all on function public.company_training_report(uuid) from public, anon;
grant execute on function public.company_training_report(uuid) to authenticated;


create or replace function public.company_certificate_ledger(p_organization_id uuid)
returns table(
  certificate_code text,
  user_id uuid,
  display_name text,
  membership_id uuid,
  course_slug text,
  course_version integer,
  issued_at timestamptz,
  revoked_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $company_certificates$
  select
    c.certificate_code,
    c.user_id,
    lp.display_name,
    e.membership_id,
    e.course_slug,
    e.course_version,
    c.issued_at,
    c.revoked_at
  from public.learner_certificates c
  join public.enrollment_completions ec on ec.id = c.completion_id
  join public.learning_enrollments e on e.id = ec.enrollment_id
  left join public.learner_profiles lp on lp.user_id = c.user_id
  where e.organization_id = p_organization_id
    and e.context_type = 'organization'
    and e.source = 'organization'
    and private.company_member_in_reviewer_scope(p_organization_id, e.membership_id)
  order by c.issued_at desc;
$company_certificates$;

revoke all on function public.company_certificate_ledger(uuid) from public, anon;
grant execute on function public.company_certificate_ledger(uuid) to authenticated;

-- Deliberately out of this proposal:
-- seat purchase/balance mutation, orders/invoices, refunds, seat withdrawal policy,
-- company lifecycle policy, FI private-content policy, and production deployment.
-- Those remain separate Human/Commerce gates.
