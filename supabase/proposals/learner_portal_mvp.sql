-- KFO Learner Portal MVP: tenant-scoped assignments and progress.
-- Existing organization_memberships remains the source of truth for employee/company/branch/department identity.

create table if not exists public.learning_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null references public.organization_memberships(id) on delete cascade,
  course_slug text not null check (course_slug ~ '^[a-z0-9-]+$'),
  course_version integer not null default 1 check (course_version > 0),
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned','in_progress','completed','cancelled')),
  unique (organization_id, membership_id, course_slug, course_version)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.learning_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id, lesson_id)
);

alter table public.learning_assignments enable row level security;
alter table public.learning_progress enable row level security;

create policy learner_reads_own_assignments on public.learning_assignments
for select to authenticated
using (exists (
  select 1 from public.organization_memberships m
  where m.id = learning_assignments.membership_id
    and m.organization_id = learning_assignments.organization_id
    and m.user_id = auth.uid() and m.status = 'active'
));

create policy learner_reads_own_progress on public.learning_progress
for select to authenticated using (user_id = auth.uid());

create policy learner_inserts_own_progress on public.learning_progress
for insert to authenticated with check (
  user_id = auth.uid() and exists (
    select 1 from public.learning_assignments a
    join public.organization_memberships m
      on m.id = a.membership_id and m.organization_id = a.organization_id
    where a.id = learning_progress.assignment_id
      and m.user_id = auth.uid() and m.status = 'active'
      and a.status <> 'cancelled'
  )
);

create policy learner_updates_own_progress on public.learning_progress
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.my_learner_portal()
returns jsonb language sql stable security invoker set search_path to ''
as $$
select jsonb_build_object(
  'memberships', coalesce((
    select jsonb_agg(jsonb_build_object(
      'membership_id', m.id,
      'organization_id', m.organization_id,
      'organization_name', o.name,
      'branch_id', m.branch_id,
      'department_id', m.department_id,
      'status', m.status
    ) order by o.name)
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id and o.tenant_access_enabled
    where m.user_id = auth.uid() and m.status = 'active'
  ), '[]'::jsonb),
  'assignments', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'organization_id', a.organization_id,
      'membership_id', a.membership_id, 'course_slug', a.course_slug,
      'course_version', a.course_version, 'assigned_at', a.assigned_at,
      'due_at', a.due_at, 'status', a.status
    ) order by a.assigned_at desc)
    from public.learning_assignments a
    join public.organization_memberships m
      on m.id = a.membership_id and m.organization_id = a.organization_id
    where m.user_id = auth.uid() and m.status = 'active'
      and a.status <> 'cancelled'
  ), '[]'::jsonb)
);
$$;
revoke all on function public.my_learner_portal() from public, anon;
grant execute on function public.my_learner_portal() to authenticated;
