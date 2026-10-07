import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const sql=await readFile(new URL('../supabase/proposals/company_portal_mvp.sql',import.meta.url),'utf8');

test('company portal reuses unified organization enrollments',()=>{
  assert.match(sql,/insert into public\.learning_enrollments/);
  assert.match(sql,/'organization'/);
  assert.doesNotMatch(sql,/create table if not exists public\.learning_assignments/);
});

test('company reports exclude personal learning',()=>{
  assert.match(sql,/e\.context_type = 'organization'/);
  assert.match(sql,/e\.source = 'organization'/);
});

test('CO and BM scope is checked server-side',()=>{
  assert.match(sql,/r\.role_code = 'CO'/);
  assert.match(sql,/r\.role_code = 'BM'/);
  assert.match(sql,/v_target\.branch_id/);
  assert.match(sql,/v_target\.department_id/);
});

test('assignment RPC is scoped and retry does not duplicate assignment notification',()=>{
  assert.match(sql,/company_member_in_reviewer_scope\(p_organization_id, v_membership\)/);
  assert.match(sql,/on conflict do nothing/);
  assert.match(sql,/if v_created then\s+insert into public\.learner_notifications/);
});

test('browser roles receive RPC execution, not broad company learning mutation grants',()=>{
  assert.match(sql,/revoke all on function public\.assign_company_course/);
  assert.match(sql,/grant execute on function public\.assign_company_course/);
  assert.doesNotMatch(sql,/grant\s+(insert|update|delete)\s+on\s+public\.learning_enrollments\s+to\s+authenticated/i);
});

test('commerce policy remains outside this proposal',()=>{
  assert.match(sql,/seat purchase\/balance mutation/);
  assert.match(sql,/refunds/);
  assert.match(sql,/separate Human\/Commerce gates/);
});

test('assignment requires a course that exists in the course engine',()=>{
  assert.match(sql,/from public\.course_activities a/);
  assert.match(sql,/a\.course_slug = p_course_slug/);
  assert.match(sql,/a\.course_version = p_course_version/);
  assert.match(sql,/raise exception 'course unavailable'/);
});

test('company certificate ledger can render learner display name without exposing personal learning',()=>{
  assert.match(sql,/lp\.display_name/);
  assert.match(sql,/left join public\.learner_profiles lp/);
  assert.match(sql,/e\.context_type = 'organization'/);
});
