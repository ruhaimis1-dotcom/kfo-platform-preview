begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
select set_config('kfo.images.org',public.admin_create_organization('QA brand images','qa-brand-images-20261015','ruhaimi.s1@gmail.com')::text,true);
reset role;
-- Metadata fixtures only; no upload or binary object is created in this SQL test.
insert into storage.objects(bucket_id,name,metadata) values('kfo-company-brand',current_setting('kfo.images.org')||'/logo/11111111-1111-4111-8111-111111111111.png','{"size":100,"mimetype":"image/png"}'),('kfo-company-brand',current_setting('kfo.images.org')||'/logo/22222222-2222-4222-8222-222222222222.png','{"size":3000000,"mimetype":"image/png"}');
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='ruhaimi.s1@gmail.com'),true);
set local role authenticated;
do $$declare org uuid:=current_setting('kfo.images.org')::uuid;k text:=org||'/logo/11111111-1111-4111-8111-111111111111.png';s jsonb;affected integer;begin
 insert into storage.objects(bucket_id,name,metadata) values('kfo-company-brand',org||'/cover/44444444-4444-4444-8444-444444444444.jpg','{"size":100,"mimetype":"image/jpeg"}');
 s:=public.save_company_brand_image(org,'logo',k,null);
 if s->>'object_key'<>k or public.company_brand_images(org)->>'logo'<>k then raise exception 'image save failed';end if;
 begin perform public.save_company_brand_image(org,'logo',null,null);raise exception 'stale save accepted';exception when serialization_failure then null;end;
 begin perform public.save_company_brand_image(org,'logo',org||'/logo/22222222-2222-4222-8222-222222222222.png',k);raise exception 'oversized logo accepted';exception when invalid_parameter_value then null;end;
 begin perform public.save_company_brand_image(org,'cover',k,null);raise exception 'wrong slot accepted';exception when invalid_parameter_value then null;end;
 begin perform public.save_company_brand_image(org,'cover',org||'/cover/33333333-3333-4333-8333-333333333333.jpg',null);raise exception 'missing object accepted';exception when invalid_parameter_value then null;end;
 update storage.objects set metadata='{}' where bucket_id='kfo-company-brand' and name=k;get diagnostics affected=row_count;if affected<>0 then raise exception 'saved object overwritten';end if;
 -- Storage protects object deletion through its API; no direct deletion is attempted here.
 s:=public.save_company_brand_image(org,'logo',null,k);if public.company_brand_images(org)->>'logo' is not null then raise exception 'clear failed';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='7sayef.1@gmail.com'),true);
set local role authenticated;
do $$declare org uuid:=current_setting('kfo.images.org')::uuid;begin
 begin insert into storage.objects(bucket_id,name,metadata) values('kfo-company-brand',org||'/cover/55555555-5555-4555-8555-555555555555.jpg','{"size":100,"mimetype":"image/jpeg"}');raise exception 'foreign upload accepted';exception when insufficient_privilege then null;end;
 begin perform public.save_company_brand_image(org,'logo',null,null);raise exception 'foreign write accepted';exception when insufficient_privilege then null;end;
 begin perform public.company_brand_images(org);raise exception 'foreign settings read accepted';exception when insufficient_privilege then null;end;
 if exists(select 1 from storage.objects where bucket_id='kfo-company-brand' and name like org||'/%') then raise exception 'foreign storage read accepted';end if;
end $$;
reset role;
set local role anon;
do $$begin begin perform public.company_brand_images(current_setting('kfo.images.org')::uuid);raise exception 'anon settings read accepted';exception when insufficient_privilege then null;end;end $$;
rollback;
