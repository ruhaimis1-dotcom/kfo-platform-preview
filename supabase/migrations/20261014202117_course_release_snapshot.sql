create table private.course_release_snapshots (
 id uuid primary key default extensions.gen_random_uuid(),course_slug text not null,course_version integer not null,
 metadata_revision integer not null,lesson_revision integer not null,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 runtime jsonb not null,assessment jsonb not null,assessment_key jsonb not null,
 unique(course_slug,course_version,metadata_revision,lesson_revision)
);
alter table private.course_release_snapshots enable row level security;
revoke all on private.course_release_snapshots from public,anon,authenticated;
create function private.admin_prepare_course_release(p_slug text,p_version integer,p_metadata_revision integer,p_lesson_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.course_authoring%rowtype;o private.course_offers%rowtype;r private.course_release_snapshots%rowtype;v_runtime jsonb;v_assessment jsonb;v_key jsonb;v_activities jsonb;v_questions jsonb;v_required jsonb;
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 if not found then raise exception 'course unavailable' using errcode='22023';end if;
 if p_metadata_revision is distinct from a.revision or p_lesson_revision is distinct from a.lesson_revision then raise exception 'draft changed' using errcode='40001';end if;
 select * into o from private.course_offers where course_slug=p_slug and course_version=p_version for share;
 if not exists(select 1 from jsonb_array_elements(a.lesson_draft) x where x->>'type'='content') or not exists(select 1 from jsonb_array_elements(a.lesson_draft) x where x->>'type'='scenario') then raise exception 'lesson and assessment question required' using errcode='22023';end if;
 select jsonb_agg(jsonb_build_object('key',x->>'key','type',x->>'type','title',x->>'title','sequence',ord,'required',true,'skillCodes','[]'::jsonb)||case when x->>'type'='content' then jsonb_build_object('content',jsonb_build_array(x->>'body')) when x->>'type'='practical_task' then jsonb_build_object('instructions',x->>'prompt') else jsonb_build_object('prompt',x->>'prompt') end order by ord),jsonb_agg(x->>'key' order by ord)
 into v_activities,v_required from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'<>'scenario';
 v_activities:=v_activities||jsonb_build_array(jsonb_build_object('key','__final-assessment','type','assessment','title','التقييم النهائي','sequence',jsonb_array_length(a.lesson_draft)+1,'required',true,'skillCodes','[]'::jsonb));
 select jsonb_agg(jsonb_build_object('id',x->>'key','prompt',x->>'prompt','options',x->'options') order by ord) into v_questions from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'='scenario';
 select jsonb_build_object('question_ids',jsonb_agg(x->>'key' order by ord),'correct_answers',jsonb_agg(x->'correctIndex' order by ord),'required_lessons',v_required,'pass_percent',75) into v_key from jsonb_array_elements(a.lesson_draft) with ordinality t(x,ord) where x->>'type'='scenario';
 v_runtime:=jsonb_build_object('slug',p_slug,'version',p_version,'title',o.title,'provider','KFO','skills','[]'::jsonb,'activities',v_activities,'passPercent',75,'certificatePolicy','assessment_and_evidence');
 v_assessment:=jsonb_build_object('courseSlug',p_slug,'courseVersion',p_version,'passPercent',75,'questions',v_questions);
 insert into private.course_release_snapshots(course_slug,course_version,metadata_revision,lesson_revision,created_by,runtime,assessment,assessment_key)
 values(p_slug,p_version,a.revision,a.lesson_revision,auth.uid(),v_runtime,v_assessment,v_key) on conflict do nothing;
 select * into r from private.course_release_snapshots where course_slug=p_slug and course_version=p_version and metadata_revision=a.revision and lesson_revision=a.lesson_revision;
 return jsonb_build_object('release_id',r.id,'course_slug',p_slug,'course_version',p_version,'metadata_revision',r.metadata_revision,'lesson_revision',r.lesson_revision,'runtime',r.runtime,'assessment',r.assessment,'status','prepared_for_review');
end $$;
revoke all on function private.admin_prepare_course_release(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function private.admin_prepare_course_release(text,integer,integer,integer) to authenticated;
create function public.admin_prepare_course_release(p_slug text,p_version integer,p_metadata_revision integer,p_lesson_revision integer) returns jsonb language sql security invoker set search_path='' as $$select private.admin_prepare_course_release(p_slug,p_version,p_metadata_revision,p_lesson_revision);$$;
revoke all on function public.admin_prepare_course_release(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.admin_prepare_course_release(text,integer,integer,integer) to authenticated;
