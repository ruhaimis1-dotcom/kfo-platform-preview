-- Optional HTTP gate setup, NOT a migration and NOT automatically executed.
-- Adds only a reserved disposable QA-B company and an extra CO membership for
-- the existing EM test user. Original A membership/role must remain unchanged.
begin;
do $$
declare v_membership uuid;
begin
  if exists (select 1 from public.organizations where id = '71000000-0000-4000-8000-000000000002'
    or slug = 'kfo-g1-assets-20261001') then
    raise exception 'reserved asset fixture already exists; inspect instead of overwriting';
  end if;
  if not exists (select 1 from public.organization_memberships m
    join public.membership_roles r on r.membership_id=m.id and r.organization_id=m.organization_id
    where m.organization_id='aa7a54d0-9bce-455d-adb4-971c21d9fdf1'
      and m.user_id='45d418a3-a986-4a14-9629-651bee191cfb' and m.status='active' and r.role_code='EM') then
    raise exception 'original EM fixture is unavailable';
  end if;
  insert into public.organizations(id,slug,display_name)
  values ('71000000-0000-4000-8000-000000000002','kfo-g1-assets-20261001','كفو — اختبار عزل الملفات B');
  insert into public.organization_memberships(organization_id,user_id,status,joined_at)
  values ('71000000-0000-4000-8000-000000000002','45d418a3-a986-4a14-9629-651bee191cfb','active',now())
  returning id into v_membership;
  insert into public.membership_roles(organization_id,membership_id,role_code)
  values ('71000000-0000-4000-8000-000000000002',v_membership,'CO');
end; $$;
select id,slug,display_name from public.organizations where id='71000000-0000-4000-8000-000000000002';
-- Inspection rehearsal rolls back. Persist only for the reviewed live HTTP run.
rollback;
