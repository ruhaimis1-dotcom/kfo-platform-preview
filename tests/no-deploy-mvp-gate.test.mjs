import test from'node:test';import assert from'node:assert/strict';import{readFile,readdir}from'node:fs/promises';
const old=await readFile(new URL('../supabase/proposals/learner_portal_mvp.sql',import.meta.url),'utf8');
const unified=await readFile(new URL('../supabase/proposals/unified_learner_context.sql',import.meta.url),'utf8');
test('legacy assignment-only proposal is explicitly blocked from application',()=>{assert.match(old.slice(0,500),/DEPRECATED PROPOSAL — DO NOT APPLY/);assert.match(old.slice(0,500),/unified_learner_context\.sql/)});
test('unified learner context is the MVP source of truth',()=>{assert.match(unified,/context_type in \('personal','organization'\)/);assert.match(unified,/enrollment_progress/);assert.match(unified,/learner_certificates/);assert.match(unified,/my_learning_dashboard/)});
test('no learner MVP proposal has been promoted into migrations before gate',async()=>{const names=await readdir(new URL('../supabase/migrations/',import.meta.url));assert.equal(names.some(n=>/learner|learning|certificate|assessment/i.test(n)),false)});
