begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select set_config('kfo.settings.org',public.admin_create_organization('QA settings restored','qa-settings-restored-20261015','ruhaimi.s1@gmail.com')::text,true);
select set_config('kfo.settings.branch',public.create_company_structure_unit(current_setting('kfo.settings.org')::uuid,'branch','QA branch',null)::text,true);
do $$declare s jsonb;b uuid;begin
 s:=public.update_company_portal_text(current_setting('kfo.settings.org')::uuid,'بوابة تجربة','مرحبًا');
 if s->'branding'->>'portal_name'<>'بوابة تجربة' then raise exception 'brand not saved';end if;
 b:=public.create_company_structure_unit(current_setting('kfo.settings.org')::uuid,'branch','QA branch',null);
 if b::text<>current_setting('kfo.settings.branch') then raise exception 'duplicate branch';end if;
 perform public.create_company_structure_unit(current_setting('kfo.settings.org')::uuid,'department','QA department',b);
 s:=public.update_company_notification_preferences(current_setting('kfo.settings.org')::uuid,false,false);
 if s->'notifications'->>'assignment_enabled'<>'false' then raise exception 'preferences not saved';end if;
end $$;
reset role;
select set_config('kfo.settings.member',(select id::text from public.organization_memberships where organization_id=current_setting('kfo.settings.org')::uuid),true);
set local role authenticated;
do $$begin
 begin perform public.update_company_member_role(current_setting('kfo.settings.org')::uuid,current_setting('kfo.settings.member')::uuid,'EM','CO',null,null);raise exception 'last owner removed';exception when insufficient_privilege then null;end;
 begin perform public.update_company_member_role(current_setting('kfo.settings.org')::uuid,current_setting('kfo.settings.member')::uuid,'SA','CO',null,null);raise exception 'SA granted';exception when invalid_parameter_value then null;end;
end $$;
reset role;
with m as (insert into public.organization_memberships(organization_id,user_id,status,joined_at) select current_setting('kfo.settings.org')::uuid,id,'active',now() from auth.users where email='7sayef.1@gmail.com' returning id,organization_id)
insert into public.membership_roles(organization_id,membership_id,role_code) select organization_id,id,'CO' from m;
set local role authenticated;
do $$declare s jsonb;begin
 s:=public.update_company_member_role(current_setting('kfo.settings.org')::uuid,current_setting('kfo.settings.member')::uuid,'BM','CO',current_setting('kfo.settings.branch')::uuid,null);
 begin perform public.update_company_member_role(current_setting('kfo.settings.org')::uuid,current_setting('kfo.settings.member')::uuid,'EM','CO',null,null);raise exception 'stale accepted';exception when serialization_failure then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.company_settings_snapshot(current_setting('kfo.settings.org')::uuid);raise exception 'BM settings allowed';exception when insufficient_privilege then null;end;
 begin perform public.update_company_notification_preferences(current_setting('kfo.settings.org')::uuid,true,true);raise exception 'BM changed preferences';exception when insufficient_privilege then null;end;
end $$;
rollback;
