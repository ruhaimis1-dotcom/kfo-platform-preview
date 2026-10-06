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


-- Learner evidence submission is RPC-only and bound to owned active enrollment + exact course activity.
create or replace function public.submit_my_learning_evidence(p_enrollment_id uuid,p_activity_id uuid,p_evidence_type text,p_payload jsonb)
returns public.learning_evidence language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_e public.learning_enrollments%rowtype; v_a public.course_activities%rowtype; v_row public.learning_evidence;
begin
 if v_uid is null then raise exception 'authenticated identity required' using errcode='42501'; end if;
 select * into v_e from public.learning_enrollments where id=p_enrollment_id and user_id=v_uid and status='active';
 if not found then raise exception 'enrollment unavailable' using errcode='42501'; end if;
 select * into v_a from public.course_activities where id=p_activity_id and course_slug=v_e.course_slug and course_version=v_e.course_version;
 if not found or v_a.activity_type not in ('reflection','practical_task','file_evidence') then raise exception 'activity unavailable' using errcode='42501'; end if;
 if p_evidence_type not in ('text','structured','file') or p_payload is null or p_payload='{}'::jsonb then raise exception 'invalid evidence' using errcode='22023'; end if;
 insert into public.learning_evidence(enrollment_id,activity_id,user_id,evidence_type,payload,review_status)
 values(v_e.id,v_a.id,v_uid,p_evidence_type,p_payload,'pending') returning * into v_row;
 return v_row;
end $$;
revoke all on function public.submit_my_learning_evidence(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.submit_my_learning_evidence(uuid,uuid,text,jsonb) to authenticated;

-- Human/deterministic review result is applied through a private helper; AI assist cannot finalize evidence.
create or replace function private.finalize_evidence_review(p_evidence_id uuid,p_rubric_id uuid,p_reviewer_type text,p_reviewer_user_id uuid,p_score numeric,p_feedback text,p_status text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_review uuid;
begin
 if p_reviewer_type not in ('human','deterministic') then raise exception 'AI assist cannot finalize evidence' using errcode='42501'; end if;
 if p_status not in ('passed','needs_revision','failed') or p_score<0 or p_score>100 then raise exception 'invalid review' using errcode='22023'; end if;
 if p_reviewer_type='human' and p_reviewer_user_id is null then raise exception 'human reviewer required' using errcode='22023'; end if;
 insert into public.evidence_reviews(evidence_id,rubric_id,reviewer_type,reviewer_user_id,score,feedback)
 values(p_evidence_id,p_rubric_id,p_reviewer_type,p_reviewer_user_id,p_score,p_feedback) returning id into v_review;
 update public.learning_evidence set review_status=p_status where id=p_evidence_id;
 return v_review;
end $$;
revoke all on function private.finalize_evidence_review(uuid,uuid,text,uuid,numeric,text,text) from public,anon,authenticated;

create or replace function private.record_skill_measurement(p_enrollment_id uuid,p_skill_id uuid,p_stage text,p_score numeric,p_source text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_user uuid; v_id uuid;
begin
 select user_id into v_user from public.learning_enrollments where id=p_enrollment_id;
 if v_user is null or p_stage not in ('pre','during','post','followup') or p_score<0 or p_score>100 then raise exception 'invalid measurement' using errcode='22023'; end if;
 insert into public.skill_measurements(enrollment_id,skill_id,user_id,stage,score,source)
 values(p_enrollment_id,p_skill_id,v_user,p_stage,p_score,p_source) returning id into v_id; return v_id;
end $$;
revoke all on function private.record_skill_measurement(uuid,uuid,text,numeric,text) from public,anon,authenticated;
