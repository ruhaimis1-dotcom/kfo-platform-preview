-- Authoring metadata is private; runtime readiness is controlled by reviewed releases.
create table private.course_authoring (
 course_slug text not null, course_version integer not null check(course_version>0),
 description text not null default '', revision integer not null default 1,
 runtime_ready boolean not null default false, updated_at timestamptz not null default now(),
 primary key(course_slug,course_version),
 foreign key(course_slug,course_version) references private.course_offers(course_slug,course_version)
);
alter table private.course_authoring enable row level security;
revoke all on private.course_authoring from public,anon,authenticated;
insert into private.course_authoring(course_slug,course_version,runtime_ready)
select course_slug,course_version,true from private.course_offers where course_slug='customer-service-reference' and course_version=1;

create table private.course_authoring_events (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
 course_slug text not null,course_version integer not null,after_state jsonb not null,occurred_at timestamptz not null default now()
);
alter table private.course_authoring_events enable row level security;
revoke all on private.course_authoring_events from public,anon,authenticated;

create function private.admin_course_editor_list() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('course_slug',o.course_slug,'course_version',o.course_version,'title',o.title,'description',a.description,'unit_amount_minor',o.unit_amount_minor,'published',o.published,'revision',a.revision,'runtime_ready',a.runtime_ready) order by o.course_slug,o.course_version desc) from private.course_offers o join private.course_authoring a using(course_slug,course_version)),'[]'::jsonb);
end $$;
create function private.admin_save_course_details(p_slug text,p_version integer,p_title text,p_description text,p_amount_minor bigint,p_published boolean,p_expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.course_authoring%rowtype;v_title text:=btrim(p_title);v_description text:=btrim(p_description);
begin
 if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform admin required' using errcode='42501';end if;
 if p_slug is null or length(p_slug)>80 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_version is null or p_version<1 or p_version>100000 or v_title is null or char_length(v_title) not between 2 and 160 or v_title ~ '[[:cntrl:]]' or v_description is null or char_length(v_description)>4000 or p_amount_minor is null or p_amount_minor not between 0 and 100000000 or p_published is null or p_expected_revision is null or p_expected_revision<0 then raise exception 'invalid course details' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('course-editor:'||p_slug||':'||p_version::text,0));
 select * into a from private.course_authoring where course_slug=p_slug and course_version=p_version for update;
 if not found then
  if p_expected_revision<>0 then raise exception 'course changed' using errcode='40001';end if;
  if exists(select 1 from private.course_offers where course_slug=p_slug and course_version=p_version) then raise exception 'course requires reviewed import' using errcode='22023';end if;
  if p_published then raise exception 'runtime not ready' using errcode='22023';end if;
  insert into private.course_offers(course_slug,course_version,title,unit_amount_minor,published) values(p_slug,p_version,v_title,p_amount_minor,false);
  insert into private.course_authoring(course_slug,course_version,description) values(p_slug,p_version,v_description);
 else
  if a.revision<>p_expected_revision then raise exception 'course changed' using errcode='40001';end if;
  if p_published and not a.runtime_ready then raise exception 'runtime not ready' using errcode='22023';end if;
  update private.course_offers set title=v_title,unit_amount_minor=p_amount_minor,published=p_published where course_slug=p_slug and course_version=p_version;
  update private.course_authoring set description=v_description,revision=revision+1,updated_at=now() where course_slug=p_slug and course_version=p_version;
 end if;
 insert into private.course_authoring_events(actor_id,course_slug,course_version,after_state)
 values(auth.uid(),p_slug,p_version,jsonb_build_object('title',v_title,'amount_minor',p_amount_minor,'published',p_published));
 return private.admin_course_editor_list();
end $$;
revoke all on function private.admin_course_editor_list(),private.admin_save_course_details(text,integer,text,text,bigint,boolean,integer) from public,anon,authenticated;
grant execute on function private.admin_course_editor_list(),private.admin_save_course_details(text,integer,text,text,bigint,boolean,integer) to authenticated;
create function public.admin_course_editor_list() returns jsonb language sql stable security invoker set search_path='' as $$select private.admin_course_editor_list();$$;
create function public.admin_save_course_details(p_slug text,p_version integer,p_title text,p_description text,p_amount_minor bigint,p_published boolean,p_expected_revision integer) returns jsonb language sql security invoker set search_path='' as $$select private.admin_save_course_details(p_slug,p_version,p_title,p_description,p_amount_minor,p_published,p_expected_revision);$$;
revoke all on function public.admin_course_editor_list(),public.admin_save_course_details(text,integer,text,text,bigint,boolean,integer) from public,anon,authenticated;
grant execute on function public.admin_course_editor_list(),public.admin_save_course_details(text,integer,text,text,bigint,boolean,integer) to authenticated;
