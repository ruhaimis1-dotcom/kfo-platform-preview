-- Preserve issue-time names for new records; never invent names for old certificates.
alter table public.learner_certificates add column holder_name text,add column course_title text;
create function private.capture_certificate_issue_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
declare e public.learning_enrollments%rowtype;
begin
 if tg_op='UPDATE' then
  if new.holder_name is distinct from old.holder_name or new.course_title is distinct from old.course_title or new.user_id is distinct from old.user_id or new.completion_id is distinct from old.completion_id or new.certificate_code is distinct from old.certificate_code or new.issued_at is distinct from old.issued_at then raise exception 'certificate identity is immutable' using errcode='22023';end if;
  return new;
 end if;
 select en.* into e from public.enrollment_completions c join public.learning_enrollments en on en.id=c.enrollment_id join public.enrollment_assessment_attempts a on a.id=c.passing_attempt_id and a.enrollment_id=en.id and a.user_id=new.user_id and a.passed where c.id=new.completion_id and c.user_id=new.user_id and en.user_id=new.user_id and en.status='completed';
 if not found then raise exception 'verified completion required' using errcode='22023';end if;
 select nullif(btrim(display_name),'') into new.holder_name from public.learner_profiles where user_id=new.user_id;
 if char_length(new.holder_name)>120 or new.holder_name~'[[:cntrl:]]' then new.holder_name:=null;end if;
 select o.title into new.course_title from private.course_offers o where o.course_slug=e.course_slug and o.course_version=e.course_version;
 return new;
end $$;
revoke all on function private.capture_certificate_issue_snapshot() from public,anon,authenticated;
create trigger certificate_issue_snapshot before insert or update on public.learner_certificates for each row execute function private.capture_certificate_issue_snapshot();
create function private.verify_learner_certificate(p_code text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r record;
begin
 if p_code is null or p_code !~ '^KFO-[A-F0-9]{16}$' then return jsonb_build_object('status','unavailable');end if;
 select cert.revoked_at,cert.issued_at,cert.course_title,e.course_slug,e.course_version into r from public.learner_certificates cert join public.enrollment_completions c on c.id=cert.completion_id and c.user_id=cert.user_id join public.learning_enrollments e on e.id=c.enrollment_id and e.user_id=cert.user_id and e.status='completed' join public.enrollment_assessment_attempts a on a.id=c.passing_attempt_id and a.user_id=cert.user_id and a.enrollment_id=e.id and a.passed where cert.certificate_code=p_code;
 if not found then return jsonb_build_object('status','unavailable');end if;
 if r.revoked_at is not null then return jsonb_build_object('status','revoked');end if;
 return jsonb_build_object('status','valid','course_slug',r.course_slug,'course_version',r.course_version,'course_title',r.course_title,'issued_at',r.issued_at);
end $$;
revoke all on function private.verify_learner_certificate(text) from public,anon,authenticated;
grant execute on function private.verify_learner_certificate(text) to anon,authenticated;
create function public.verify_learner_certificate(p_code text) returns jsonb language sql stable security invoker set search_path='' as $$select private.verify_learner_certificate(p_code);$$;
revoke all on function public.verify_learner_certificate(text) from public,anon,authenticated;
grant execute on function public.verify_learner_certificate(text) to anon,authenticated;
