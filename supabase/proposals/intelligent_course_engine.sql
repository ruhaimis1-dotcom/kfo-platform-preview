-- Review-only intelligent course engine proposal. No Deploy Until MVP Gate.
create table if not exists public.course_skills (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 skill_code text not null, title text not null, outcome text not null, unique(course_slug,course_version,skill_code)
);
create table if not exists public.course_activities (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 activity_key text not null, activity_type text not null check(activity_type in ('content','quick_check','scenario','ordering','error_spotting','reflection','practical_task','file_evidence','simulation','assessment')),
 title text not null, sequence_no integer not null check(sequence_no>0), required boolean not null default true,
 config jsonb not null default '{}'::jsonb, unique(course_slug,course_version,activity_key)
);
create table if not exists public.course_activity_skills (
 activity_id uuid not null references public.course_activities(id) on delete cascade,
 skill_id uuid not null references public.course_skills(id) on delete cascade,
 weight numeric(6,3) not null default 1 check(weight>0), primary key(activity_id,skill_id)
);
create table if not exists public.course_rubrics (
 id uuid primary key default gen_random_uuid(), course_slug text not null, course_version integer not null,
 rubric_key text not null, title text not null, criteria jsonb not null, unique(course_slug,course_version,rubric_key)
);
create table if not exists public.learning_evidence (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 activity_id uuid not null references public.course_activities(id), user_id uuid not null references auth.users(id) on delete cascade,
 evidence_type text not null check(evidence_type in ('text','structured','file','observation')),
 payload jsonb not null default '{}'::jsonb, submitted_at timestamptz not null default now(),
 review_status text not null default 'pending' check(review_status in ('pending','passed','needs_revision','failed'))
);
create table if not exists public.evidence_reviews (
 id uuid primary key default gen_random_uuid(), evidence_id uuid not null references public.learning_evidence(id) on delete cascade,
 rubric_id uuid references public.course_rubrics(id), reviewer_type text not null check(reviewer_type in ('human','deterministic','ai_assist')),
 reviewer_user_id uuid references auth.users(id), score numeric(6,2), feedback text, created_at timestamptz not null default now(),
 check(reviewer_type<>'human' or reviewer_user_id is not null)
);
create table if not exists public.skill_measurements (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 skill_id uuid not null references public.course_skills(id), user_id uuid not null references auth.users(id) on delete cascade,
 stage text not null check(stage in ('pre','during','post','followup')), score numeric(6,2) check(score between 0 and 100),
 measured_at timestamptz not null default now(), source text not null
);
create table if not exists public.impact_checkpoints (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, checkpoint_days integer not null check(checkpoint_days in (30,60,90)),
 due_at timestamptz not null, completed_at timestamptz, learner_score numeric(6,2), manager_score numeric(6,2), notes text,
 unique(enrollment_id,checkpoint_days)
);
alter table public.learning_evidence enable row level security; alter table public.evidence_reviews enable row level security;
alter table public.skill_measurements enable row level security; alter table public.impact_checkpoints enable row level security;
create policy learner_reads_own_evidence on public.learning_evidence for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_measurements on public.skill_measurements for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_impact on public.impact_checkpoints for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.learning_evidence from authenticated;
revoke insert,update,delete on public.evidence_reviews from authenticated;
revoke insert,update,delete on public.skill_measurements from authenticated;
revoke insert,update,delete on public.impact_checkpoints from authenticated;
