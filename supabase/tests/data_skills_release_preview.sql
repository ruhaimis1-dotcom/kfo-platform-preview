begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.admin_course_release_preview('9258a28c-c395-433d-8b30-c249e50cb4b7');
 if r->>'course_slug'<>'excel-basics' or jsonb_array_length(r->'assessment'->'questions')<>8 then raise exception 'Excel preview mismatch';end if;
 r:=public.admin_course_release_preview('a89992df-c64e-445b-b72e-48ab92ad4a84');
 if r->>'course_slug'<>'power-bi-basics' or jsonb_array_length(r->'assessment'->'questions')<>8 then raise exception 'Power BI preview mismatch';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare id uuid;begin
 for id in select unnest(array['9258a28c-c395-433d-8b30-c249e50cb4b7'::uuid,'a89992df-c64e-445b-b72e-48ab92ad4a84'::uuid]) loop
  begin perform public.admin_course_release_preview(id);raise exception 'learner preview access accepted';exception when insufficient_privilege then null;end;
 end loop;
end $$;
reset role;
set local role anon;
do $$begin begin perform public.admin_course_release_preview('9258a28c-c395-433d-8b30-c249e50cb4b7');raise exception 'anon preview access accepted';exception when insufficient_privilege then null;end;end $$;
rollback;
