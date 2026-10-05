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


create table if not exists public.assessment_attempts (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.learning_assignments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, score_percent numeric(5,2) not null check(score_percent between 0 and 100),
 passed boolean not null, submitted_at timestamptz not null default now()
);
create table if not exists public.course_completions (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null unique references public.learning_assignments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, completed_at timestamptz not null default now(),
 passing_attempt_id uuid not null references public.assessment_attempts(id)
);
create table if not exists public.certificates (
 id uuid primary key default gen_random_uuid(), completion_id uuid not null unique references public.course_completions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, organization_id uuid not null references public.organizations(id) on delete cascade,
 certificate_code text not null unique default ('KFO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 issued_at timestamptz not null default now(), revoked_at timestamptz
);
alter table public.assessment_attempts enable row level security;
alter table public.course_completions enable row level security;
alter table public.certificates enable row level security;
create policy learner_reads_own_attempts on public.assessment_attempts for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_completions on public.course_completions for select to authenticated using(user_id=auth.uid());
create policy learner_reads_own_certificates on public.certificates for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.assessment_attempts from authenticated;
revoke insert,update,delete on public.course_completions from authenticated;
revoke insert,update,delete on public.certificates from authenticated;
-- Grading/completion/certificate creation must be atomic in a reviewed server-side RPC.
-- No browser-facing grant may create these evidence rows directly.
create or replace function public.verify_certificate(p_code text)
returns table(certificate_code text,issued_at timestamptz,revoked boolean,course_slug text,course_version integer,organization_name text)
language sql stable security definer set search_path to ''
as $$ select c.certificate_code,c.issued_at,c.revoked_at is not null,a.course_slug,a.course_version,o.name
from public.certificates c join public.course_completions cc on cc.id=c.completion_id
join public.learning_assignments a on a.id=cc.assignment_id join public.organizations o on o.id=c.organization_id
where c.certificate_code=upper(btrim(p_code)) limit 1 $$;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon,authenticated;


-- Server-side assessment contract. Answer keys are passed only by trusted server code after matching
-- the versioned course content; browser clients must never receive or choose p_correct_answers.
create or replace function private.record_graded_assessment(
  p_assignment_id uuid, p_answers integer[], p_correct_answers integer[], p_required_lessons text[], p_pass_percent numeric default 75
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_a public.learning_assignments%rowtype; v_done integer; v_score numeric; v_passed boolean;
v_attempt uuid; v_completion uuid; v_certificate text;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select a.* into v_a from public.learning_assignments a join public.organization_memberships m
 on m.id=a.membership_id and m.organization_id=a.organization_id
 where a.id=p_assignment_id and m.user_id=v_uid and m.status='active' and a.status<>'cancelled' for update;
 if not found then raise exception 'assignment unavailable' using errcode='42501'; end if;
 if cardinality(p_answers)=0 or cardinality(p_answers)<>cardinality(p_correct_answers) then raise exception 'invalid assessment payload' using errcode='22023'; end if;
 select count(distinct lp.lesson_id) into v_done from public.learning_progress lp
 where lp.assignment_id=v_a.id and lp.user_id=v_uid and lp.completed_at is not null and lp.lesson_id=any(p_required_lessons);
 if v_done<>cardinality(p_required_lessons) then raise exception 'lessons incomplete' using errcode='22023'; end if;
 select 100.0*count(*) filter(where x.answer=x.correct)/cardinality(p_answers) into v_score
 from unnest(p_answers,p_correct_answers) as x(answer,correct);
 v_passed:=v_score>=p_pass_percent;
 insert into public.assessment_attempts(assignment_id,user_id,score_percent,passed) values(v_a.id,v_uid,v_score,v_passed) returning id into v_attempt;
 if v_passed then
   insert into public.course_completions(assignment_id,user_id,passing_attempt_id) values(v_a.id,v_uid,v_attempt)
   on conflict(assignment_id) do update set passing_attempt_id=excluded.passing_attempt_id returning id into v_completion;
   update public.learning_assignments set status='completed' where id=v_a.id;
   insert into public.certificates(completion_id,user_id,organization_id) values(v_completion,v_uid,v_a.organization_id)
   on conflict(completion_id) do nothing;
   select c.certificate_code into v_certificate from public.certificates c where c.completion_id=v_completion;
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score_percent',v_score,'passed',v_passed,'certificate_code',v_certificate);
end $$;
revoke all on function private.record_graded_assessment(uuid,integer[],integer[],text[],numeric) from public,anon,authenticated;


-- Official assessment answer keys live only in the database/server boundary.
create table if not exists private.course_assessment_keys (
 course_slug text not null, course_version integer not null, question_ids text[] not null,
 correct_answers integer[] not null, required_lessons text[] not null, pass_percent numeric(5,2) not null default 75,
 primary key(course_slug,course_version),
 check(cardinality(question_ids)>0 and cardinality(question_ids)=cardinality(correct_answers)),
 check(cardinality(required_lessons)>0), check(pass_percent between 1 and 100)
);
revoke all on private.course_assessment_keys from public,anon,authenticated;

create or replace function public.submit_official_assessment(p_assignment_id uuid,p_question_ids text[],p_answers integer[])
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_a public.learning_assignments%rowtype; v_key private.course_assessment_keys%rowtype;
begin
 select a.* into v_a from public.learning_assignments a join public.organization_memberships m
 on m.id=a.membership_id and m.organization_id=a.organization_id
 where a.id=p_assignment_id and m.user_id=auth.uid() and m.status='active' and a.status<>'cancelled';
 if not found then raise exception 'assignment unavailable' using errcode='42501'; end if;
 select * into v_key from private.course_assessment_keys k where k.course_slug=v_a.course_slug and k.course_version=v_a.course_version;
 if not found then raise exception 'assessment unavailable' using errcode='22023'; end if;
 if p_question_ids is distinct from v_key.question_ids or cardinality(p_answers)<>cardinality(v_key.correct_answers)
 then raise exception 'assessment payload mismatch' using errcode='22023'; end if;
 return private.record_graded_assessment(v_a.id,p_answers,v_key.correct_answers,v_key.required_lessons,v_key.pass_percent);
end $$;
revoke all on function public.submit_official_assessment(uuid,text[],integer[]) from public,anon;
grant execute on function public.submit_official_assessment(uuid,text[],integer[]) to authenticated;
