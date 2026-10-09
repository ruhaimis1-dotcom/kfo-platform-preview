import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
const sql=await readFile(new URL('../supabase/proposals/learner_portal_mvp.sql',import.meta.url),'utf8');
const fn=sql.slice(sql.indexOf('create or replace function private.record_graded_assessment'));
test('grading locks and validates the learner assignment',()=>{assert.match(fn,/m\.user_id=v_uid/);assert.match(fn,/m\.status='active'/);assert.match(fn,/a\.status<>'cancelled'/);assert.match(fn,/for update/)});
test('grading refuses assessment until all required lessons are complete',()=>{assert.match(fn,/completed_at is not null/);assert.match(fn,/v_done<>cardinality\(p_required_lessons\)/);assert.match(fn,/lessons incomplete/)});
test('attempt is evidence and certificate only follows pass',()=>{const attempt=fn.indexOf('insert into public.assessment_attempts');const pass=fn.indexOf('if v_passed then');const completion=fn.indexOf('insert into public.course_completions');const cert=fn.indexOf('insert into public.certificates');assert.ok(attempt>0&&attempt<pass&&pass<completion&&completion<cert)});
test('grading helper is private and unavailable to browser roles',()=>{assert.match(fn,/revoke all on function private\.record_graded_assessment[\s\S]*from public,anon,authenticated/);assert.equal(/grant execute on function private\.record_graded_assessment/.test(fn),false)});
test('completion and certificate issuance are idempotent per assignment',()=>{assert.match(fn,/on conflict\(assignment_id\)/);assert.match(fn,/on conflict\(completion_id\) do nothing/)});
