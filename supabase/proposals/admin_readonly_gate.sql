-- KFO Admin Gate read-only RPC contract.
-- Requires an active SA role. No mutation RPCs in this migration.

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists(
    select 1
    from public.organization_memberships m
    join public.membership_roles r
      on r.membership_id=m.id and r.organization_id=m.organization_id
    where m.user_id=auth.uid()
      and m.status='active'
      and r.role_code='SA'
  );
$$;
revoke all on function private.is_platform_admin() from public,anon,authenticated;

create or replace function public.admin_platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return jsonb_build_object(
    'organizations',(select count(*) from public.organizations),
    'memberships',(select count(*) from public.organization_memberships),
    'courses',(select count(*) from (select distinct course_slug,course_version from public.course_activities) c),
    'certificates',(select count(*) from public.learner_certificates),
    'pending_reviews',(select count(*) from public.learning_evidence where review_status in ('pending','revision')),
    'audit_events',(select count(*) from public.audit_events)
  );
end $$;
revoke all on function public.admin_platform_overview() from public,anon;
grant execute on function public.admin_platform_overview() to authenticated;

create or replace function public.admin_organization_directory()
returns table(
  organization_id uuid,
  slug text,
  display_name text,
  tenant_access_enabled boolean,
  member_count bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  select o.id,o.slug,o.display_name,o.tenant_access_enabled,
    count(m.id)::bigint,o.created_at
  from public.organizations o
  left join public.organization_memberships m
    on m.organization_id=o.id and m.status='active'
  group by o.id,o.slug,o.display_name,o.tenant_access_enabled,o.created_at
  order by o.created_at desc,o.display_name;
end $$;
revoke all on function public.admin_organization_directory() from public,anon;
grant execute on function public.admin_organization_directory() to authenticated;

create or replace function public.admin_membership_directory()
returns table(
  organization_id uuid,
  organization_name text,
  membership_id uuid,
  user_id uuid,
  display_name text,
  role_code text,
  membership_status text,
  branch_id uuid,
  department_id uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  select o.id,o.display_name,m.id,m.user_id,
    coalesce(lp.display_name,m.user_id::text),
    r.role_code,m.status,m.branch_id,m.department_id,m.created_at
  from public.organization_memberships m
  join public.organizations o on o.id=m.organization_id
  left join public.learner_profiles lp on lp.user_id=m.user_id
  left join public.membership_roles r
    on r.membership_id=m.id and r.organization_id=m.organization_id
  order by o.display_name,coalesce(lp.display_name,m.user_id::text),r.role_code;
end $$;
revoke all on function public.admin_membership_directory() from public,anon;
grant execute on function public.admin_membership_directory() to authenticated;

create or replace function public.admin_course_directory()
returns table(
  course_slug text,
  course_version integer,
  activity_count bigint,
  skill_count bigint
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  with a as (
    select ca.course_slug,ca.course_version,count(*)::bigint activity_count
    from public.course_activities ca
    group by ca.course_slug,ca.course_version
  ),
  s as (
    select cs.course_slug,cs.course_version,count(*)::bigint skill_count
    from public.course_skills cs
    group by cs.course_slug,cs.course_version
  )
  select a.course_slug,a.course_version,a.activity_count,coalesce(s.skill_count,0)::bigint
  from a
  left join s using(course_slug,course_version)
  order by a.course_slug,a.course_version desc;
end $$;
revoke all on function public.admin_course_directory() from public,anon;
grant execute on function public.admin_course_directory() to authenticated;

create or replace function public.admin_certificate_directory()
returns table(
  certificate_code text,
  user_id uuid,
  display_name text,
  course_slug text,
  course_version integer,
  organization_name text,
  issued_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  select c.certificate_code,c.user_id,
    coalesce(lp.display_name,c.user_id::text),
    e.course_slug,e.course_version,o.display_name,c.issued_at,c.revoked_at
  from public.learner_certificates c
  join public.enrollment_completions ec on ec.id=c.completion_id
  join public.learning_enrollments e on e.id=ec.enrollment_id
  left join public.learner_profiles lp on lp.user_id=c.user_id
  left join public.organizations o on o.id=e.organization_id
  order by c.issued_at desc;
end $$;
revoke all on function public.admin_certificate_directory() from public,anon;
grant execute on function public.admin_certificate_directory() to authenticated;

create or replace function public.admin_evidence_review_queue()
returns table(
  evidence_id uuid,
  user_id uuid,
  display_name text,
  course_slug text,
  course_version integer,
  activity_key text,
  evidence_type text,
  review_status text,
  submitted_at timestamptz,
  organization_name text
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  select ev.id,ev.user_id,coalesce(lp.display_name,ev.user_id::text),
    en.course_slug,en.course_version,a.activity_key,ev.evidence_type,
    ev.review_status,ev.submitted_at,o.display_name
  from public.learning_evidence ev
  join public.learning_enrollments en on en.id=ev.enrollment_id
  join public.course_activities a on a.id=ev.activity_id
  left join public.learner_profiles lp on lp.user_id=ev.user_id
  left join public.organizations o on o.id=en.organization_id
  where ev.review_status in ('pending','revision')
  order by ev.submitted_at asc;
end $$;
revoke all on function public.admin_evidence_review_queue() from public,anon;
grant execute on function public.admin_evidence_review_queue() to authenticated;

create or replace function public.admin_audit_log()
returns table(
  event_id bigint,
  event_type text,
  organization_name text,
  actor_id uuid,
  actor_label text,
  resource_type text,
  resource_id text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  return query
  select ae.id,ae.action,o.display_name,ae.actor_id,
    coalesce(lp.display_name,ae.actor_id::text,'نظام كفو'),
    ae.resource_type,ae.resource_id,ae.occurred_at
  from public.audit_events ae
  left join public.organizations o on o.id=ae.organization_id
  left join public.learner_profiles lp on lp.user_id=ae.actor_id
  order by ae.occurred_at desc
  limit 200;
end $$;
revoke all on function public.admin_audit_log() from public,anon;
grant execute on function public.admin_audit_log() to authenticated;
