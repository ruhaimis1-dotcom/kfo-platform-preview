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
revoke insert,update,delete on public.learner_notifications from authenticated;
-- Profile mutation will use a narrow RPC; organization enrollments are never self-created by learners.


-- Unified learning evidence: every record belongs to one enrollment, regardless of context.
create table if not exists public.enrollment_progress (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, lesson_id text not null,
 completed_at timestamptz, updated_at timestamptz not null default now(), unique(enrollment_id,lesson_id)
);
create table if not exists public.enrollment_assessment_attempts (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.learning_enrollments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, score_percent numeric(5,2) not null check(score_percent between 0 and 100),
 passed boolean not null, submitted_at timestamptz not null default now()
);
create table if not exists public.enrollment_completions (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null unique references public.learning_enrollments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, passing_attempt_id uuid not null references public.enrollment_assessment_attempts(id),
 completed_at timestamptz not null default now()
);
create table if not exists public.learner_certificates (
 id uuid primary key default gen_random_uuid(), completion_id uuid not null unique references public.enrollment_completions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, certificate_code text not null unique default('KFO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 issued_at timestamptz not null default now(), revoked_at timestamptz
);
alter table public.enrollment_progress enable row level security;
alter table public.enrollment_assessment_attempts enable row level security;
alter table public.enrollment_completions enable row level security;
alter table public.learner_certificates enable row level security;
create policy learner_reads_own_enrollment_progress on public.enrollment_progress for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_enrollment_attempts on public.enrollment_assessment_attempts for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_enrollment_completions on public.enrollment_completions for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_certificate_wallet on public.learner_certificates for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.enrollment_assessment_attempts from authenticated;
revoke insert,update,delete on public.enrollment_completions from authenticated;
revoke insert,update,delete on public.learner_certificates from authenticated;

create or replace function public.my_learning_dashboard()
returns jsonb language sql stable security invoker set search_path to '' as $$
select jsonb_build_object(
 'total',count(*),
 'personal',count(*) filter(where e.context_type='personal'),
 'organization',count(*) filter(where e.context_type='organization'),
 'active',count(*) filter(where e.status='active'),
 'completed',count(*) filter(where e.status='completed'),
 'certificates',(select count(*) from public.learner_certificates c where c.user_id=auth.uid()),
 'unread_notifications',(select count(*) from public.learner_notifications n where n.user_id=auth.uid() and n.read_at is null)
) from public.learning_enrollments e where e.user_id=auth.uid() and e.status<>'cancelled';
$$;
revoke all on function public.my_learning_dashboard() from public,anon;
grant execute on function public.my_learning_dashboard() to authenticated;


-- Narrow learner mutations. Callers never supply user_id.
create or replace function public.update_my_learner_profile(p_display_name text,p_headline text)
returns public.learner_profiles language plpgsql security definer set search_path to '' as $$
declare v_name text:=nullif(btrim(p_display_name),''); v_headline text:=nullif(btrim(p_headline),''); v_row public.learner_profiles;
begin
 if auth.uid() is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 if v_name is null or char_length(v_name)>120 or coalesce(char_length(v_headline),0)>180 then raise exception 'invalid profile' using errcode='22023'; end if;
 insert into public.learner_profiles(user_id,display_name,headline,updated_at) values(auth.uid(),v_name,v_headline,now())
 on conflict(user_id) do update set display_name=excluded.display_name,headline=excluded.headline,updated_at=now()
 returning * into v_row; return v_row;
end $$;
revoke insert,update,delete on public.learner_profiles from authenticated;
create policy learner_creates_own_profile on public.learner_profiles for insert to authenticated with check(user_id=auth.uid());
create policy learner_updates_own_profile on public.learner_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on function public.update_my_learner_profile(text,text) from public,anon;
grant execute on function public.update_my_learner_profile(text,text) to authenticated;

create or replace function public.mark_my_notification_read(p_notification_id uuid)
returns timestamptz language plpgsql security definer set search_path to '' as $$
declare v_read timestamptz;
begin
 update public.learner_notifications set read_at=coalesce(read_at,now())
 where id=p_notification_id and user_id=auth.uid() returning read_at into v_read;
 if v_read is null then raise exception 'notification unavailable' using errcode='42501'; end if;
 return v_read;
end $$;
revoke all on function public.mark_my_notification_read(uuid) from public,anon;
grant execute on function public.mark_my_notification_read(uuid) to authenticated;

create or replace function public.complete_my_lesson(p_enrollment_id uuid,p_lesson_id text)
returns public.enrollment_progress language plpgsql security definer set search_path to '' as $$
declare v_row public.enrollment_progress; v_lesson text:=btrim(p_lesson_id);
begin
 if auth.uid() is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 if v_lesson='' or char_length(v_lesson)>120 then raise exception 'invalid lesson' using errcode='22023'; end if;
 if not exists(select 1 from public.learning_enrollments e where e.id=p_enrollment_id and e.user_id=auth.uid() and e.status='active')
 then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 insert into public.enrollment_progress(enrollment_id,user_id,lesson_id,completed_at,updated_at)
 values(p_enrollment_id,auth.uid(),v_lesson,now(),now())
 on conflict(enrollment_id,lesson_id) do update set completed_at=coalesce(public.enrollment_progress.completed_at,excluded.completed_at),updated_at=now()
 returning * into v_row; return v_row;
end $$;
revoke insert,update,delete on public.enrollment_progress from authenticated;
create policy learner_creates_own_progress on public.enrollment_progress for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.learning_enrollments e where e.id=enrollment_id and e.user_id=auth.uid() and e.status='active'));
create policy learner_updates_own_progress on public.enrollment_progress for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on function public.complete_my_lesson(uuid,text) from public,anon;
grant execute on function public.complete_my_lesson(uuid,text) to authenticated;
