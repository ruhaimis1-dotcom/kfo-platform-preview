-- Newleap integration boundary: no provider API or payment confirmation enabled.
create table if not exists private.course_offers(
  course_slug text not null, course_version integer not null check(course_version>0),
  title text not null, unit_amount_minor bigint not null default 0 check(unit_amount_minor between 0 and 100000000),
  currency text not null default 'SAR' check(currency='SAR'),
  published boolean not null default false,
  primary key(course_slug,course_version)
);
create table if not exists private.company_course_orders(
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  actor_id uuid not null references auth.users(id), request_key uuid not null,
  course_slug text not null,course_version integer not null,
  quantity integer not null check(quantity between 1 and 10000),
  unit_amount_minor bigint not null, amount_minor bigint not null,
  currency text not null check(currency='SAR'),
  status text not null check(status in ('free_confirmed','awaiting_payment')),
  payment_provider text not null default 'newleap',
  created_at timestamptz not null default now(),
  foreign key(course_slug,course_version) references private.course_offers(course_slug,course_version),
  unique(organization_id,request_key),
  check(unit_amount_minor>=0 and amount_minor=quantity::bigint*unit_amount_minor),
  check((amount_minor=0 and status='free_confirmed') or (amount_minor>0 and status='awaiting_payment'))
);
alter table private.course_offers enable row level security;
alter table private.company_course_orders enable row level security;
revoke all on private.course_offers,private.company_course_orders from public,anon,authenticated;
insert into private.course_offers(course_slug,course_version,title,published)
select 'customer-service-reference',1,'خدمة العملاء: من الفهم إلى الأثر',true
where exists(select 1 from public.course_activities where course_slug='customer-service-reference' and course_version=1)
on conflict do nothing;

create or replace function private.can_manage_course_orders(p_org uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null
    and exists(select 1 from public.organizations where id=p_org and tenant_access_enabled)
    and (private.is_platform_admin() or private.has_org_permission(p_org,'organization.settings.manage'));
$$;
revoke all on function private.can_manage_course_orders(uuid) from public,anon,authenticated;

create or replace function private.company_course_offers(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'order access required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('course_slug',course_slug,'course_version',course_version,'title',title,'unit_amount_minor',unit_amount_minor,'currency',currency) order by title) from private.course_offers where published),'[]'::jsonb);
end $$;
revoke all on function private.company_course_offers(uuid) from public,anon,authenticated;
grant execute on function private.company_course_offers(uuid) to authenticated;

create or replace function private.create_company_course_order(
  p_organization_id uuid,p_course_slug text,p_course_version integer,p_quantity integer,p_request_key uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_offer private.course_offers%rowtype;v_order private.company_course_orders%rowtype;
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'order access required' using errcode='42501'; end if;
  if p_quantity is null or p_quantity not between 1 and 10000 or p_request_key is null then raise exception 'invalid order' using errcode='22023'; end if;
  -- Concurrent retries share a lock; a repeated key cannot create a second order.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text||p_request_key::text,0));
  select * into v_order from private.company_course_orders where organization_id=p_organization_id and request_key=p_request_key;
  if found then
    if v_order.course_slug is distinct from p_course_slug or v_order.course_version is distinct from p_course_version or v_order.quantity is distinct from p_quantity then
      raise exception 'request key conflict' using errcode='22023';
    end if;
    return to_jsonb(v_order)-'request_key'-'actor_id';
  end if;
  select * into v_offer from private.course_offers where course_slug=p_course_slug and course_version=p_course_version and published for share;
  if not found then raise exception 'course offer unavailable' using errcode='22023'; end if;
  insert into private.company_course_orders(organization_id,actor_id,request_key,course_slug,course_version,quantity,unit_amount_minor,amount_minor,currency,status)
    values(p_organization_id,auth.uid(),p_request_key,p_course_slug,p_course_version,p_quantity,v_offer.unit_amount_minor,p_quantity::bigint*v_offer.unit_amount_minor,v_offer.currency,
      case when v_offer.unit_amount_minor=0 then 'free_confirmed' else 'awaiting_payment' end)
    returning * into v_order;
  insert into public.audit_events(organization_id,actor_id,action,resource_type,resource_id,after_state)
    values(p_organization_id,auth.uid(),'create_course_order','course_order',v_order.id::text,jsonb_build_object('status',v_order.status,'amount_minor',v_order.amount_minor,'quantity',v_order.quantity));
  return to_jsonb(v_order)-'request_key'-'actor_id';
end $$;
revoke all on function private.create_company_course_order(uuid,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function private.create_company_course_order(uuid,text,integer,integer,uuid) to authenticated;

create or replace function private.company_course_order_history(p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_manage_course_orders(p_organization_id) then raise exception 'order access required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(o)-'request_key'-'actor_id' order by o.created_at desc)
    from (select * from private.company_course_orders where organization_id=p_organization_id order by created_at desc limit 100) o),'[]'::jsonb);
end $$;
revoke all on function private.company_course_order_history(uuid) from public,anon,authenticated;
grant execute on function private.company_course_order_history(uuid) to authenticated;

-- Stop direct assignment/enrollment bypasses as well as checkout UI bypasses.
-- A trusted Newleap fulfillment path must replace this gate after integration.
create or replace function private.block_unpaid_course_enrollment()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform 1 from private.course_offers where course_slug=new.course_slug and course_version=new.course_version and unit_amount_minor>0 for share;
  if found then raise exception 'payment integration pending' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.block_unpaid_course_enrollment() from public,anon,authenticated;
create trigger block_unpaid_course_enrollment before insert or update of course_slug,course_version on public.learning_enrollments
for each row execute function private.block_unpaid_course_enrollment();

create or replace function public.company_course_offers(p_organization_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.company_course_offers(p_organization_id); $$;
revoke all on function public.company_course_offers(uuid) from public,anon,authenticated;
grant execute on function public.company_course_offers(uuid) to authenticated;

create or replace function public.create_company_course_order(p_organization_id uuid,p_course_slug text,p_course_version integer,p_quantity integer,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.create_company_course_order(p_organization_id,p_course_slug,p_course_version,p_quantity,p_request_key); $$;
revoke all on function public.create_company_course_order(uuid,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.create_company_course_order(uuid,text,integer,integer,uuid) to authenticated;

create or replace function public.company_course_order_history(p_organization_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.company_course_order_history(p_organization_id); $$;
revoke all on function public.company_course_order_history(uuid) from public,anon,authenticated;
grant execute on function public.company_course_order_history(uuid) to authenticated;
