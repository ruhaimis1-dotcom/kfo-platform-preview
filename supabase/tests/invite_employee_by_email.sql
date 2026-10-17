begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
select set_config('kfo.invite_org',public.admin_create_organization('QA invitation rollback','qa-invite-'||substr(replace(gen_random_uuid()::text,'-',''),1,8),'7sayef.1@gmail.com')::text,true);
update public.organizations set tenant_access_enabled=true where id=current_setting('kfo.invite_org')::uuid;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
select set_config('kfo.invite_id',public.invite_employee_by_email(current_setting('kfo.invite_org')::uuid,' RUHAIMI.S1@GMAIL.COM ')::text,true);
do $$begin
 if public.invite_employee_by_email(current_setting('kfo.invite_org')::uuid,'ruhaimi.s1@gmail.com')::text<>current_setting('kfo.invite_id') then raise exception 'retry not idempotent';end if;
 begin perform public.invite_employee_by_email(current_setting('kfo.invite_org')::uuid,'qa-absent-'||gen_random_uuid()||'@example.invalid');raise exception 'unknown account accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 if not exists(select 1 from public.organization_memberships m join public.membership_roles r on r.membership_id=m.id where m.id=current_setting('kfo.invite_id')::uuid and m.status='invited' and r.role_code='EM') then raise exception 'pending employee invitation missing';end if;
end$$;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$begin
 begin perform public.invite_employee_by_email(current_setting('kfo.invite_org')::uuid,'saud@hirely.sa');raise exception 'employee invited member';exception when insufficient_privilege then null;end;
 perform public.accept_invitation(current_setting('kfo.invite_id')::uuid);
end$$;
reset role;
do $$begin if not exists(select 1 from public.organization_memberships where id=current_setting('kfo.invite_id')::uuid and status='active') then raise exception 'acceptance failed';end if;end$$;
set local role anon;
do $$begin begin perform public.invite_employee_by_email(current_setting('kfo.invite_org')::uuid,'saud@hirely.sa');raise exception 'anon invited';exception when insufficient_privilege then null;end;end$$;
rollback;
