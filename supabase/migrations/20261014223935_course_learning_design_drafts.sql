-- Draft-only design; lesson revision identifies the complete atomic authoring state.
alter table private.course_authoring add column learning_design jsonb not null default '{"skills":[],"activitySkills":{},"rubrics":{}}'::jsonb;
create function private.validate_course_learning_design(d jsonb,activities jsonb) returns void language plpgsql immutable security invoker set search_path='' as $$
declare s jsonb;codes text[]:='{}';k text;v jsonb;c jsonb;seen text[];total integer;
begin
 if d is null or jsonb_typeof(d)<>'object' or exists(select 1 from jsonb_object_keys(d) f where f not in ('skills','activitySkills','rubrics')) or jsonb_typeof(d->'skills') is distinct from 'array' or jsonb_array_length(d->'skills')>30 or jsonb_typeof(d->'activitySkills') is distinct from 'object' or jsonb_typeof(d->'rubrics') is distinct from 'object' or octet_length(d::text)>150000 then raise exception 'invalid learning design' using errcode='22023';end if;
 for s in select value from jsonb_array_elements(d->'skills') loop
  if jsonb_typeof(s)<>'object' or exists(select 1 from jsonb_object_keys(s) f where f not in ('code','title','outcome')) or jsonb_typeof(s->'code') is distinct from 'string' or (s->>'code') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(s->>'code')>80 or (s->>'code')=any(codes) or jsonb_typeof(s->'title') is distinct from 'string' or char_length(btrim(s->>'title'))<2 or char_length(s->>'title')>160 or (s->>'title')~'[[:cntrl:]]' or jsonb_typeof(s->'outcome') is distinct from 'string' or char_length(btrim(s->>'outcome'))<2 or char_length(s->>'outcome')>1000 or (s->>'outcome')~'[[:cntrl:]]' then raise exception 'invalid skill' using errcode='22023';end if;
  codes:=array_append(codes,s->>'code');
 end loop;
 for k,v in select key,value from jsonb_each(d->'activitySkills') loop
  if not exists(select 1 from jsonb_array_elements(activities) a where a->>'key'=k) or jsonb_typeof(v)<>'array' or jsonb_array_length(v)>30 then raise exception 'invalid activity skills' using errcode='22023';end if;
  seen:='{}';
  for s in select value from jsonb_array_elements(v) loop
   if jsonb_typeof(s)<>'string' or not (s#>>'{}')=any(codes) or (s#>>'{}')=any(seen) then raise exception 'unknown or duplicate skill' using errcode='22023';end if;
   seen:=array_append(seen,s#>>'{}');
  end loop;
 end loop;
 for k,v in select key,value from jsonb_each(d->'rubrics') loop
  if not exists(select 1 from jsonb_array_elements(activities) a where a->>'key'=k and a->>'type'='practical_task') or jsonb_typeof(v)<>'object' or exists(select 1 from jsonb_object_keys(v) f where f not in ('title','criteria')) or jsonb_typeof(v->'title') is distinct from 'string' or char_length(btrim(v->>'title'))<2 or char_length(v->>'title')>160 or (v->>'title')~'[[:cntrl:]]' or jsonb_typeof(v->'criteria') is distinct from 'array' or jsonb_array_length(v->'criteria') not between 1 and 10 then raise exception 'invalid task rubric' using errcode='22023';end if;
  total:=0;seen:='{}';
  for c in select value from jsonb_array_elements(v->'criteria') loop
   if jsonb_typeof(c)<>'object' or exists(select 1 from jsonb_object_keys(c) f where f not in ('title','description','weight')) or jsonb_typeof(c->'title') is distinct from 'string' or char_length(btrim(c->>'title'))<2 or char_length(c->>'title')>160 or (c->>'title')~'[[:cntrl:]]' or btrim(c->>'title')=any(seen) or jsonb_typeof(c->'description') is distinct from 'string' or char_length(btrim(c->>'description'))<2 or char_length(c->>'description')>1000 or (c->>'description')~'[[:cntrl:]]' or jsonb_typeof(c->'weight') is distinct from 'number' or (c->>'weight') !~ '^([1-9][0-9]?|100)$' then raise exception 'invalid rubric criterion' using errcode='22023';end if;
   seen:=array_append(seen,btrim(c->>'title'));total:=total+(c->>'weight')::integer;
  end loop;
  if total<>100 then raise exception 'rubric weights must total 100' using errcode='22023';end if;
 end loop;
end $$;
revoke all on function private.validate_course_learning_design(jsonb,jsonb) from public,anon,authenticated;
create or replace function private.admin_course_lesson_draft(p_slug text,p_version integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a private.course_authoring%rowtype;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 return jsonb_build_object('course_slug',a.course_slug,'course_version',a.course_version,'revision',a.lesson_revision,'activities',a.lesson_draft,'learning_design',a.learning_design);
end $$;
create function private.admin_save_course_design(p_slug text,p_version integer,p_activities jsonb,p_design jsonb,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 -- The existing lesson RPC validates activities, locks the course and checks the revision.
 -- Any later failure rolls the entire call back, including its event and revision increment.
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 perform 1 from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 perform private.validate_course_learning_design(p_design,p_activities);
 update private.course_authoring set learning_design=p_design where course_slug=p_slug and course_version=p_version;
 perform private.admin_save_course_lessons(p_slug,p_version,p_activities,p_expected_revision);
 insert into private.course_authoring_events(actor_id,course_slug,course_version,after_state) values(auth.uid(),p_slug,p_version,jsonb_build_object('kind','learning_design','revision',p_expected_revision+1,'design',p_design));
 return private.admin_course_lesson_draft(p_slug,p_version);
end $$;
revoke all on function private.admin_save_course_design(text,integer,jsonb,jsonb,integer) from public,anon,authenticated;
grant execute on function private.admin_save_course_design(text,integer,jsonb,jsonb,integer) to authenticated;
create function public.admin_save_course_design(p_slug text,p_version integer,p_activities jsonb,p_design jsonb,p_expected_revision integer) returns jsonb language sql security invoker set search_path='' as $$select private.admin_save_course_design(p_slug,p_version,p_activities,p_design,p_expected_revision);$$;
revoke all on function public.admin_save_course_design(text,integer,jsonb,jsonb,integer) from public,anon,authenticated;
grant execute on function public.admin_save_course_design(text,integer,jsonb,jsonb,integer) to authenticated;
create or replace function private.admin_prepare_course_release(p_slug text,p_version integer,p_metadata_revision integer,p_lesson_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.course_authoring%rowtype;o private.course_offers%rowtype;r private.course_release_snapshots%rowtype;v_runtime jsonb;v_assessment jsonb;v_key jsonb;v_activities jsonb;v_questions jsonb;v_required jsonb;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 if p_metadata_revision is distinct from a.revision or p_lesson_revision is distinct from a.lesson_revision then raise exception 'draft changed' using errcode='40001';end if;
 perform private.validate_course_learning_design(a.learning_design,a.lesson_draft);
 select * into o from private.course_offers where course_slug=p_slug and course_version=p_version for share;
 if not exists(select 1 from jsonb_array_elements(a.lesson_draft) x where x->>'type'='content') or not exists(select 1 from jsonb_array_elements(a.lesson_draft) x where x->>'type'='scenario') then raise exception 'lesson and assessment question required' using errcode='22023';end if;
 select jsonb_agg(jsonb_build_object('key',x->>'key','type',x->>'type','title',x->>'title','sequence',ord,'required',true,'skillCodes',coalesce(a.learning_design->'activitySkills'->(x->>'key'),'[]'::jsonb))||case when x->>'type'='content' then jsonb_build_object('content',jsonb_build_array(x->>'body')) when x->>'type'='practical_task' then jsonb_build_object('instructions',x->>'prompt') else jsonb_build_object('prompt',x->>'prompt') end||case when a.learning_design->'rubrics' ? (x->>'key') then jsonb_build_object('rubric',a.learning_design->'rubrics'->(x->>'key')) else '{}'::jsonb end order by ord),jsonb_agg(x->>'key' order by ord)
 into v_activities,v_required from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'<>'scenario';
 v_activities:=v_activities||jsonb_build_array(jsonb_build_object('key','__final-assessment','type','assessment','title','التقييم النهائي','sequence',jsonb_array_length(a.lesson_draft)+1,'required',true,'skillCodes',coalesce((select jsonb_agg(distinct code) from jsonb_array_elements(a.lesson_draft) q cross join lateral jsonb_array_elements(coalesce(a.learning_design->'activitySkills'->(q->>'key'),'[]'::jsonb)) code where q->>'type'='scenario'),'[]'::jsonb)));
 select jsonb_agg(jsonb_build_object('id',x->>'key','prompt',x->>'prompt','options',x->'options','skillCodes',coalesce(a.learning_design->'activitySkills'->(x->>'key'),'[]'::jsonb)) order by ord) into v_questions from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'='scenario';
 select jsonb_build_object('question_ids',jsonb_agg(x->>'key' order by ord),'correct_answers',jsonb_agg(x->'correctIndex' order by ord),'required_lessons',v_required,'pass_percent',75) into v_key from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'='scenario';
 v_runtime:=jsonb_build_object('slug',p_slug,'version',p_version,'title',o.title,'provider','KFO','skills',a.learning_design->'skills','activities',v_activities,'passPercent',75,'certificatePolicy','assessment_and_evidence');
 v_assessment:=jsonb_build_object('courseSlug',p_slug,'courseVersion',p_version,'passPercent',75,'questions',v_questions);
 insert into private.course_release_snapshots(course_slug,course_version,metadata_revision,lesson_revision,created_by,runtime,assessment,assessment_key)
 values(p_slug,p_version,a.revision,a.lesson_revision,auth.uid(),v_runtime,v_assessment,v_key) on conflict do nothing;
 select * into r from private.course_release_snapshots where course_slug=p_slug and course_version=p_version and metadata_revision=a.revision and lesson_revision=a.lesson_revision;
 return jsonb_build_object('release_id',r.id,'course_slug',p_slug,'course_version',p_version,'metadata_revision',r.metadata_revision,'lesson_revision',r.lesson_revision,'runtime',r.runtime,'assessment',r.assessment,'status','prepared_for_review');
end $$;

-- Older clients must not orphan existing design references.
create or replace function private.admin_save_course_lessons(p_slug text,p_version integer,p_activities jsonb,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.course_authoring%rowtype;x jsonb;opt jsonb;seen text[]:='{}';k text;t text;v_index integer;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 if p_activities is null or jsonb_typeof(p_activities)<>'array' or jsonb_array_length(p_activities)>60 or octet_length(p_activities::text)>250000 or p_expected_revision is null or p_expected_revision<0 then raise exception 'invalid lesson draft' using errcode='22023';end if;
 for x in select value from jsonb_array_elements(p_activities) loop
  if jsonb_typeof(x)<>'object' or exists(select 1 from jsonb_object_keys(x) f where f not in ('key','type','title','body','prompt','options','correctIndex')) then raise exception 'invalid activity fields' using errcode='22023';end if;
  k:=x->>'key';t:=x->>'type';
  if jsonb_typeof(x->'key') is distinct from 'string' or k !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(k)>80 or k=any(seen) or t is null or t not in ('content','reflection','practical_task','scenario') or jsonb_typeof(x->'title') is distinct from 'string' or char_length(btrim(x->>'title')) not between 2 and 160 or (x->>'title') ~ '[[:cntrl:]]' then raise exception 'invalid activity' using errcode='22023';end if;
  seen:=array_append(seen,k);
  if t='content' then
   if jsonb_typeof(x->'body') is distinct from 'string' or char_length(btrim(x->>'body')) not between 1 and 12000 or x ?| array['prompt','options','correctIndex'] then raise exception 'invalid lesson body' using errcode='22023';end if;
  else
   if jsonb_typeof(x->'prompt') is distinct from 'string' or char_length(btrim(x->>'prompt')) not between 1 and 4000 or x ? 'body' then raise exception 'invalid prompt' using errcode='22023';end if;
   if t='scenario' then
    if jsonb_typeof(x->'options') is distinct from 'array' or jsonb_array_length(x->'options') not between 2 and 6 or jsonb_typeof(x->'correctIndex') is distinct from 'number' or (x->>'correctIndex') !~ '^[0-5]$' then raise exception 'invalid question' using errcode='22023';end if;
    v_index:=(x->>'correctIndex')::integer;
    if v_index>=jsonb_array_length(x->'options') then raise exception 'invalid answer' using errcode='22023';end if;
    for opt in select value from jsonb_array_elements(x->'options') loop
     if jsonb_typeof(opt)<>'string' or char_length(btrim(opt#>>'{}')) not between 1 and 500 then raise exception 'invalid option' using errcode='22023';end if;
    end loop;
   elsif x ?| array['options','correctIndex'] then raise exception 'unexpected answer' using errcode='22023';end if;
  end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 if a.lesson_revision<>p_expected_revision then raise exception 'lesson draft changed' using errcode='40001';end if;
 perform private.validate_course_learning_design(a.learning_design,p_activities);
 update private.course_authoring set lesson_draft=p_activities,lesson_revision=lesson_revision+1,updated_at=now() where course_slug=p_slug and course_version=p_version;
 insert into private.course_authoring_events(actor_id,course_slug,course_version,after_state) values(auth.uid(),p_slug,p_version,jsonb_build_object('kind','lesson_draft','revision',a.lesson_revision+1,'activities',p_activities));
 return private.admin_course_lesson_draft(p_slug,p_version);
end $$;
