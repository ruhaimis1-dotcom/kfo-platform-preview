begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select set_config('kfo.colors.org',public.admin_create_organization('QA portal colors','qa-portal-colors-20261015','ruhaimi.s1@gmail.com')::text,true);
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare s jsonb;org uuid:=current_setting('kfo.colors.org')::uuid;begin
 s:=public.update_company_portal_text(org,'بوابة الألوان','رسالة محفوظة');
 s:=public.update_company_portal_colors(org,'#123456','#234567','#04180F','#123B32');
 if s->'branding'->>'primary_color'<>'#123456' or s->'branding'->>'secondary_color'<>'#234567' or s->'branding'->>'portal_name'<>'بوابة الألوان' or s->'branding'->>'welcome_copy'<>'رسالة محفوظة' then raise exception 'colors overwrite text or fail save';end if;
 begin perform public.update_company_portal_colors(org,'#000000','#000000','#04180F','#123B32');raise exception 'stale colors accepted';exception when serialization_failure then null;end;
 begin perform public.update_company_portal_colors(org,'#FFFFFF','#234567','#123456','#234567');raise exception 'unreadable colors accepted';exception when invalid_parameter_value then null;end;
 begin perform public.update_company_portal_colors(org,'red','#234567','#123456','#234567');raise exception 'CSS input accepted';exception when invalid_parameter_value then null;end;
 begin perform public.update_company_portal_colors(org,null,'#234567','#123456','#234567');raise exception 'null color accepted';exception when invalid_parameter_value then null;end;
 s:=public.company_settings_snapshot(org);
 if s->'branding'->>'primary_color'<>'#123456' then raise exception 'failed update changed stored color';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.update_company_portal_colors(current_setting('kfo.colors.org')::uuid,'#000000','#000000','#123456','#234567');raise exception 'foreign manager wrote colors';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.update_company_portal_colors(current_setting('kfo.colors.org')::uuid,'#000000','#000000','#123456','#234567');raise exception 'anon wrote colors';exception when insufficient_privilege then null;end;
end $$;
rollback;
