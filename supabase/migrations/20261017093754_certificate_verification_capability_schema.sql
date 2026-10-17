-- Dedicated minimal capability schema: do not grant anon access to private.
create schema certificate_verification;
grant usage on schema certificate_verification to anon,authenticated;
alter function private.verify_learner_certificate(text) set schema certificate_verification;
create or replace function public.verify_learner_certificate(p_code text) returns jsonb language sql stable security invoker set search_path='' as $$select certificate_verification.verify_learner_certificate(p_code);$$;
