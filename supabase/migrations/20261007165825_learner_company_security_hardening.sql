-- Applied migration: learner/company security hardening. Supabase version 20261007165825.

alter table public.course_skills enable row level security;
alter table public.course_activities enable row level security;
alter table public.course_activity_skills enable row level security;
alter table public.course_rubrics enable row level security;

drop policy if exists course_skills_read_authenticated on public.course_skills;
create policy course_skills_read_authenticated
on public.course_skills for select to authenticated
using (true);

drop policy if exists course_activities_read_authenticated on public.course_activities;
create policy course_activities_read_authenticated
on public.course_activities for select to authenticated
using (true);

drop policy if exists course_activity_skills_read_authenticated on public.course_activity_skills;
create policy course_activity_skills_read_authenticated
on public.course_activity_skills for select to authenticated
using (true);

drop policy if exists course_rubrics_read_authenticated on public.course_rubrics;
create policy course_rubrics_read_authenticated
on public.course_rubrics for select to authenticated
using (true);

grant select on public.course_skills, public.course_activities, public.course_activity_skills, public.course_rubrics to authenticated;
revoke insert, update, delete on public.course_skills, public.course_activities, public.course_activity_skills, public.course_rubrics from authenticated, anon;
revoke select on public.course_skills, public.course_activities, public.course_activity_skills, public.course_rubrics from anon;

revoke all on function public.finalize_my_file_evidence(uuid,uuid,text,text,text,bigint)
from public, anon, authenticated;
