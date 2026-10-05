-- KFO unified learner context proposal. Review-only until MVP Gate.
create table if not exists public.learner_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text, avatar_path text, headline text, updated_at timestamptz not null default now()
);
create table if not exists public.learning_enrollments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 context_type text not null check(context_type in ('personal','organization')),
 organization_id uuid references public.organizations(id) on delete cascade,
 membership_id uuid references public.organization_memberships(id) on delete cascade,
 course_slug text not null check(course_slug ~ '^[a-z0-9-]+$'),
 course_version integer not null default 1 check(course_version>0),
 source text not null check(source in ('self','kfo','organization')),
 enrolled_at timestamptz not null default now(), due_at timestamptz,
 status text not null default 'active' check(status in ('active','completed','cancelled')),
 check(
  (context_type='personal' and organization_id is null and membership_id is null and source in ('self','kfo'))
  or
  (context_type='organization' and organization_id is not null and membership_id is not null and source='organization')
 )
);
create unique index if not exists learning_enrollments_personal_unique on public.learning_enrollments(user_id,course_slug,course_version) where context_type='personal' and status<>'cancelled';
create unique index if not exists learning_enrollments_org_unique on public.learning_enrollments(user_id,organization_id,course_slug,course_version) where context_type='organization' and status<>'cancelled';

create table if not exists public.learner_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('assignment','due_soon','learning_reminder','assessment_result','certificate','course_update')),
 title text not null, body text not null, enrollment_id uuid references public.learning_enrollments(id) on delete cascade,
 created_at timestamptz not null default now(), read_at timestamptz
);
alter table public.learner_profiles enable row level security;
alter table public.learning_enrollments enable row level security;
alter table public.learner_notifications enable row level security;
create policy learner_owns_profile on public.learner_profiles for select to authenticated using(user_id=auth.uid());
create policy learner_reads_enrollments on public.learning_enrollments for select to authenticated using(user_id=auth.uid());
create policy learner_reads_notifications on public.learner_notifications for select to authenticated using(user_id=auth.uid());
create policy learner_marks_notifications on public.learner_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Profile mutation will use a narrow RPC; organization enrollments are never self-created by learners.
