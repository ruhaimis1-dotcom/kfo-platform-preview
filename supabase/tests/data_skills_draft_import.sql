-- Run after create-only data-skills import. All verification writes roll back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
do $$declare d jsonb;s text;begin
 for s in select unnest(array['excel-basics','power-bi-basics']) loop
  d:=public.admin_course_lesson_draft(s,1);
  if (d->>'revision')::integer<>1 or jsonb_array_length(d->'learning_design'->'skills')<>8 then raise exception 'import revision/design mismatch';end if;
  begin perform public.admin_save_course_details(s,1,'تحقق فقط','لا تحفظ',0,false,0);raise exception 'duplicate create accepted';exception when serialization_failure then null;end;
  begin perform public.admin_save_course_details(s,1,'تحقق فقط','لا تحفظ',0,true,1);raise exception 'unready publish accepted';exception when invalid_parameter_value then null;end;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare s text;begin
 for s in select unnest(array['excel-basics','power-bi-basics']) loop
  begin perform public.admin_course_lesson_draft(s,1);raise exception 'learner read private draft';exception when insufficient_privilege then null;end;
 end loop;
end $$;
reset role;
set local role anon;
do $$begin begin perform public.admin_course_editor_list();raise exception 'anonymous read editor';exception when insufficient_privilege then null;end;end $$;
reset role;
do $$begin
 if (select count(*) from private.course_offers o join private.course_authoring a using(course_slug,course_version) where o.course_slug in ('excel-basics','power-bi-basics') and o.course_version=1 and not o.published and not a.runtime_ready and a.revision=1 and a.lesson_revision=1)<>2 then raise exception 'draft activation guard failed';end if;
end $$;
rollback;
