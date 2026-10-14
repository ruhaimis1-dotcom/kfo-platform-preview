begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select public.admin_save_course_details('qa-editor-rebuilt-20261015',1,'QA rebuilt editor','temporary',0,false,0);
do $$declare r jsonb;again jsonb;begin
 perform public.admin_save_course_lessons('qa-editor-rebuilt-20261015',1,'[{"key":"intro","type":"content","title":"مقدمة","body":"نص"},{"key":"q1","type":"scenario","title":"سؤال","prompt":"اختر","options":["أ","ب"],"correctIndex":1}]',0);
 begin perform public.admin_save_course_lessons('qa-editor-rebuilt-20261015',1,'[]',0);raise exception 'stale lessons accepted';exception when serialization_failure then null;end;
 begin perform public.admin_save_course_details('qa-editor-rebuilt-20261015',1,'QA rebuilt editor','',0,true,1);raise exception 'unready published';exception when invalid_parameter_value then null;end;
 r:=public.admin_prepare_course_release('qa-editor-rebuilt-20261015',1,1,1);
 again:=public.admin_prepare_course_release('qa-editor-rebuilt-20261015',1,1,1);
 if r->>'release_id'<>again->>'release_id' then raise exception 'duplicate release';end if;
 perform set_config('kfo.editor.release',r->>'release_id',true);
 r:=public.admin_course_release_preview((r->>'release_id')::uuid);
 if r->>'course_slug'<>'qa-editor-rebuilt-20261015' or r::text like '%correctIndex%' or r::text like '%correct_answers%' then raise exception 'invalid preview';end if;
 if exists(select 1 from jsonb_array_elements(public.my_course_offers()) x where x->>'course_slug'='qa-editor-rebuilt-20261015') then raise exception 'draft offered';end if;
end $$;
reset role;
do $$begin
 if exists(select 1 from public.course_activities where course_slug='qa-editor-rebuilt-20261015') or exists(select 1 from private.enrollment_assessment_keys where course_slug='qa-editor-rebuilt-20261015') then raise exception 'prepared release activated';end if;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.admin_course_editor_list();raise exception 'BM read editor';exception when insufficient_privilege then null;end;
 begin perform public.admin_course_release_preview(current_setting('kfo.editor.release')::uuid);raise exception 'BM read preview';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.admin_course_release_preview(current_setting('kfo.editor.release')::uuid);raise exception 'anon read preview';exception when insufficient_privilege then null;end;
end $$;
rollback;
