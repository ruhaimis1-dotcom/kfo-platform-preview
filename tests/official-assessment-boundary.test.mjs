import test from 'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
const sql=await readFile(new URL('../supabase/proposals/learner_portal_mvp.sql',import.meta.url),'utf8');
const start=sql.indexOf('create table if not exists private.course_assessment_keys');const official=sql.slice(start);
test('official answer keys are private and never selectable by browser roles',()=>{assert.match(official,/private\.course_assessment_keys/);assert.match(official,/revoke all on private\.course_assessment_keys from public,anon,authenticated/)});
test('official submission resolves key by assigned course and exact version',()=>{assert.match(official,/k\.course_slug=v_a\.course_slug/);assert.match(official,/k\.course_version=v_a\.course_version/)});
test('question identity and answer count must match server contract',()=>{assert.match(official,/p_question_ids is distinct from v_key\.question_ids/);assert.match(official,/cardinality\(p_answers\)<>cardinality\(v_key\.correct_answers\)/)});
test('browser sends answers but never correct answers to public RPC',()=>{assert.match(official,/submit_official_assessment\(p_assignment_id uuid,p_question_ids text\[\],p_answers integer\[\]\)/);const publicSig=official.match(/submit_official_assessment\(([^)]*)\)/)?.[1]||'';assert.equal(publicSig.includes('correct'),false)});
