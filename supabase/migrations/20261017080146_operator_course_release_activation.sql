-- Operator-only activation. Invoke only after the human MVP/release gate.
-- No API wrapper or client EXECUTE grant. Course versions are immutable once activated.
create function private.activate_course_release(p_release_id uuid,p_metadata_revision integer,p_lesson_revision integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r private.course_release_snapshots%rowtype;a private.course_authoring%rowtype;x jsonb;s jsonb;sid uuid;aid uuid;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 select * into r from private.course_release_snapshots where id=p_release_id;
 if not found then raise exception 'release unavailable' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||r.course_slug||':'||r.course_version::text,0));
 select * into a from private.course_authoring where course_slug=r.course_slug and course_version=r.course_version for update;
 if not found or a.revision is distinct from p_metadata_revision or a.lesson_revision is distinct from p_lesson_revision or r.metadata_revision is distinct from p_metadata_revision or r.lesson_revision is distinct from p_lesson_revision then raise exception 'reviewed draft changed' using errcode='40001';end if;
 perform 1 from private.course_offers where course_slug=r.course_slug and course_version=r.course_version for update;
 if exists(select 1 from private.course_runtime_bindings where course_slug=r.course_slug and course_version=r.course_version)
 or exists(select 1 from public.course_activities where course_slug=r.course_slug and course_version=r.course_version)
 or exists(select 1 from public.course_skills where course_slug=r.course_slug and course_version=r.course_version)
 or exists(select 1 from public.course_rubrics where course_slug=r.course_slug and course_version=r.course_version)
 or exists(select 1 from private.enrollment_assessment_keys where course_slug=r.course_slug and course_version=r.course_version)
 or exists(select 1 from public.learning_enrollments where course_slug=r.course_slug and course_version=r.course_version)
 then raise exception 'course version already in use; create a new version' using errcode='40001';end if;
 perform private.validate_course_learning_design(a.learning_design,a.lesson_draft);
 if jsonb_array_length(r.runtime->'skills')=0 or exists(select 1 from jsonb_array_elements(r.runtime->'activities') v where jsonb_array_length(v->'skillCodes')=0 or (v->>'type'='practical_task' and not v ? 'rubric')) then raise exception 'complete learning design required' using errcode='22023';end if;
 for s in select value from jsonb_array_elements(r.runtime->'skills') loop
  insert into public.course_skills(course_slug,course_version,skill_code,title,outcome) values(r.course_slug,r.course_version,s->>'code',s->>'title',s->>'outcome');
 end loop;
 for x in select value from jsonb_array_elements(r.runtime->'activities') loop
  insert into public.course_activities(course_slug,course_version,activity_key,activity_type,title,sequence_no,required,config)
  values(r.course_slug,r.course_version,x->>'key',x->>'type',x->>'title',(x->>'sequence')::integer,(x->>'required')::boolean,x) returning id into aid;
  insert into public.course_activity_skills(activity_id,skill_id,weight)
  select aid,sk.id,1 from jsonb_array_elements_text(x->'skillCodes') c join public.course_skills sk on sk.skill_code=c.value and sk.course_slug=r.course_slug and sk.course_version=r.course_version;
  if x ? 'rubric' then
   insert into public.course_rubrics(course_slug,course_version,rubric_key,title,criteria) values(r.course_slug,r.course_version,x->>'key',x->'rubric'->>'title',x->'rubric'->'criteria');
  end if;
 end loop;
 insert into private.assessment_question_skills(course_slug,course_version,question_id,skill_id)
 select r.course_slug,r.course_version,q->>'id',sk.id from jsonb_array_elements(r.assessment->'questions') q cross join lateral jsonb_array_elements_text(q->'skillCodes') c join public.course_skills sk on sk.skill_code=c.value and sk.course_slug=r.course_slug and sk.course_version=r.course_version;
 insert into private.enrollment_assessment_keys(course_slug,course_version,question_ids,correct_answers,required_lessons,pass_percent)
 values(r.course_slug,r.course_version,array(select jsonb_array_elements_text(r.assessment_key->'question_ids')),array(select v::integer from jsonb_array_elements_text(r.assessment_key->'correct_answers') v),array(select jsonb_array_elements_text(r.assessment_key->'required_lessons')),(r.assessment_key->>'pass_percent')::integer);
 insert into private.course_runtime_bindings(course_slug,course_version,release_id) values(r.course_slug,r.course_version,r.id);
 update private.course_authoring set runtime_ready=true,updated_at=now() where course_slug=r.course_slug and course_version=r.course_version;
 update private.course_offers set published=true where course_slug=r.course_slug and course_version=r.course_version;
 insert into private.course_authoring_events(actor_id,course_slug,course_version,after_state) values(auth.uid(),r.course_slug,r.course_version,jsonb_build_object('kind','release_activation','release_id',r.id,'metadata_revision',r.metadata_revision,'lesson_revision',r.lesson_revision));
 return jsonb_build_object('status','activated','release_id',r.id,'course_slug',r.course_slug,'course_version',r.course_version);
end $$;
revoke all on function private.activate_course_release(uuid,integer,integer) from public,anon,authenticated;
