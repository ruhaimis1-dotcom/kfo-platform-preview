create table private.personal_course_orders(
  id uuid primary key default extensions.gen_random_uuid(),user_id uuid not null references auth.users(id),request_key uuid not null,
  course_slug text not null,course_version integer not null,
  amount_minor bigint not null check(amount_minor>=0),currency text not null check(currency='SAR'),
  status text not null check(status in ('free_confirmed','awaiting_payment')),
  enrollment_id uuid references public.learning_enrollments(id),payment_provider text not null default 'newleap',
  created_at timestamptz not null default now(),unique(user_id,request_key),
  foreign key(course_slug,course_version) references private.course_offers(course_slug,course_version),
  check((amount_minor=0 and status='free_confirmed' and enrollment_id is not null) or
    (amount_minor>0 and status='awaiting_payment' and enrollment_id is null))
);
alter table private.personal_course_orders enable row level security;
revoke all on private.personal_course_orders from public,anon,authenticated;
create function private.my_course_offers() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('course_slug',course_slug,'course_version',course_version,'title',title,'unit_amount_minor',unit_amount_minor,'currency',currency) order by title) from private.course_offers where published),'[]'::jsonb);
end $$;
create function private.my_course_order_history() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(o)-'user_id'-'request_key' order by o.created_at desc) from
    (select * from private.personal_course_orders where user_id=auth.uid() order by created_at desc limit 100) o),'[]'::jsonb);
end $$;
create function private.create_my_course_order(p_course_slug text,p_course_version integer,p_request_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_offer private.course_offers%rowtype;v_order private.personal_course_orders%rowtype;v_enrollment uuid;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_request_key is null then raise exception 'invalid request key' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_request_key::text,1));
  select * into v_order from private.personal_course_orders where user_id=auth.uid() and request_key=p_request_key;
  if found then
    if v_order.course_slug is distinct from p_course_slug or v_order.course_version is distinct from p_course_version then raise exception 'request key conflict' using errcode='22023'; end if;
    return to_jsonb(v_order)-'user_id'-'request_key';
  end if;
  select * into v_offer from private.course_offers where course_slug=p_course_slug and course_version=p_course_version and published for share;
  if not found then raise exception 'course unavailable' using errcode='22023'; end if;
  if v_offer.unit_amount_minor=0 then
    insert into public.learning_enrollments(user_id,context_type,course_slug,course_version,source,status)
      values(auth.uid(),'personal',p_course_slug,p_course_version,'self','active') on conflict do nothing returning id into v_enrollment;
    if v_enrollment is null then
      select id into v_enrollment from public.learning_enrollments where user_id=auth.uid() and context_type='personal' and course_slug=p_course_slug and course_version=p_course_version and status<>'cancelled' limit 1;
    end if;
  end if;
  insert into private.personal_course_orders(user_id,request_key,course_slug,course_version,amount_minor,currency,status,enrollment_id)
    values(auth.uid(),p_request_key,p_course_slug,p_course_version,v_offer.unit_amount_minor,v_offer.currency,
      case when v_offer.unit_amount_minor=0 then 'free_confirmed' else 'awaiting_payment' end,v_enrollment) returning * into v_order;
  return to_jsonb(v_order)-'user_id'-'request_key';
end $$;
revoke all on function private.my_course_offers(),private.my_course_order_history(),private.create_my_course_order(text,integer,uuid) from public,anon,authenticated;
grant execute on function private.my_course_offers(),private.my_course_order_history(),private.create_my_course_order(text,integer,uuid) to authenticated;
create function public.my_course_offers() returns jsonb language sql stable security invoker set search_path='' as $$select private.my_course_offers();$$;
create function public.my_course_order_history() returns jsonb language sql stable security invoker set search_path='' as $$select private.my_course_order_history();$$;
create function public.create_my_course_order(p_course_slug text,p_course_version integer,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.create_my_course_order(p_course_slug,p_course_version,p_request_key);$$;
revoke all on function public.my_course_offers(),public.my_course_order_history(),public.create_my_course_order(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.my_course_offers(),public.my_course_order_history(),public.create_my_course_order(text,integer,uuid) to authenticated;
