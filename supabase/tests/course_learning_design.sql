begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select public.admin_save_course_details('qa-design-20261015',1,'QA design','temporary',0,false,0);
do $$declare acts jsonb:='[{"key":"intro","type":"content","title":"مقدمة","body":"نص"},{"key":"task","type":"practical_task","title":"مهمة","prompt":"طبق"},{"key":"q1","type":"scenario","title":"سؤال","prompt":"اختر","options":["أ","ب"],"correctIndex":1}]';d jsonb:='{"skills":[{"code":"planning","title":"التخطيط","outcome":"إعداد خطة"}],"activitySkills":{"intro":["planning"],"task":["planning"],"q1":["planning"]},"rubrics":{"task":{"title":"معايير الخطة","criteria":[{"title":"الوضوح","description":"هدف واضح","weight":60},{"title":"الاكتمال","description":"كل الخطوات","weight":40}]}}}';r jsonb;old jsonb;newer jsonb;before_count integer;
begin
 r:=public.admin_save_course_design('qa-design-20261015',1,acts,d,0);
 if r->>'revision'<>'1' or r->'learning_design'<>d then raise exception 'design not saved';end if;
 old:=public.admin_prepare_course_release('qa-design-20261015',1,1,1);
 if old->'runtime'->'skills'<>d->'skills' or old->'runtime'->'activities'->1->'rubric'<>d->'rubrics'->'task' or old->'runtime'->'activities'->0->'skillCodes'<>'["planning"]'::jsonb or old->'assessment'->'questions'->0->'skillCodes'<>'["planning"]'::jsonb or old->'runtime'->'activities'->2->'skillCodes'<>'["planning"]'::jsonb then raise exception 'snapshot design missing';end if;
 if old::text like '%correctIndex%' or old::text like '%correct_answers%' then raise exception 'answer leak';end if;
 begin perform public.admin_save_course_design('qa-design-20261015',1,acts,jsonb_set(d,'{rubrics,task,criteria,0,weight}','61'),1);raise exception 'bad weights accepted';exception when invalid_parameter_value then null;end;
 r:=public.admin_course_lesson_draft('qa-design-20261015',1);
 if r->>'revision'<>'1' or r->'learning_design'<>d then raise exception 'failed save was not atomic';end if;
 begin perform public.admin_save_course_design('qa-design-20261015',1,acts,jsonb_set(d,'{activitySkills,q1}','["foreign"]'),1);raise exception 'foreign skill accepted';exception when invalid_parameter_value then null;end;
 begin perform public.admin_save_course_design('qa-design-20261015',1,acts,d,0);raise exception 'stale design accepted';exception when serialization_failure then null;end;
 begin perform public.admin_save_course_lessons('qa-design-20261015',1,acts-1,1);raise exception 'legacy orphan accepted';exception when invalid_parameter_value then null;end;
 d:=jsonb_set(d,'{skills,0,title}','"التخطيط المحسن"');
 perform public.admin_save_course_design('qa-design-20261015',1,acts,d,1);
 newer:=public.admin_prepare_course_release('qa-design-20261015',1,1,2);
 if newer->>'release_id'=old->>'release_id' or newer->'runtime'->'skills'->0->>'title'<>'التخطيط المحسن' then raise exception 'new design reused old snapshot';end if;
 r:=public.admin_course_release_preview((old->>'release_id')::uuid);
 if r<>old then raise exception 'old snapshot mutated';end if;
 perform set_config('kfo.design.release',old->>'release_id',true);
end $$;
reset role;
do $$begin
 if exists(select 1 from public.course_activities where course_slug='qa-design-20261015') or exists(select 1 from private.enrollment_assessment_keys where course_slug='qa-design-20261015') then raise exception 'draft activated';end if;
 if exists(select 1 from private.course_authoring where course_slug='qa-design-20261015' and runtime_ready) then raise exception 'runtime readiness changed';end if;
 if not exists(select 1 from private.course_release_snapshots where course_slug='qa-design-20261015' and assessment_key->'correct_answers'='[1]'::jsonb) then raise exception 'private key lost';end if;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.admin_save_course_design('qa-design-20261015',1,'[]','{"skills":[],"activitySkills":{},"rubrics":{}}',2);raise exception 'BM wrote design';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.admin_save_course_design('qa-design-20261015',1,'[]','{"skills":[],"activitySkills":{},"rubrics":{}}',2);raise exception 'anon wrote design';exception when insufficient_privilege then null;end;
end $$;
rollback;
