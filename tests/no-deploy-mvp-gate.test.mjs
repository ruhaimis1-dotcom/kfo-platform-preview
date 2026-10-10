import test from'node:test';import assert from'node:assert/strict';import{readFile,readdir}from'node:fs/promises';
const old=await readFile(new URL('../supabase/proposals/learner_portal_mvp.sql',import.meta.url),'utf8');
const unified=await readFile(new URL('../supabase/proposals/unified_learner_context.sql',import.meta.url),'utf8');
test('legacy assignment-only proposal is explicitly blocked from application',()=>{assert.match(old.slice(0,500),/DEPRECATED PROPOSAL — DO NOT APPLY/);assert.match(old.slice(0,500),/unified_learner_context\.sql/)});
test('unified learner context is the MVP source of truth',()=>{assert.match(unified,/context_type in \('personal','organization'\)/);assert.match(unified,/enrollment_progress/);assert.match(unified,/learner_certificates/);assert.match(unified,/my_learning_dashboard/)});
test('learner migrations stay within the recorded integration gate scope',async()=>{
 const names=await readdir(new URL('../supabase/migrations/',import.meta.url));
 const scoped=names.filter(n=>/learner|learning|certificate|assessment|course_engine|reference_course|private_evidence/i.test(n)).sort();
 assert.deepEqual(scoped,[
  '20261007165639_unified_learner_context.sql',
  '20261007165647_intelligent_course_engine.sql',
  '20261007165652_reference_course_seed.sql',
  '20261007165825_learner_company_security_hardening.sql',
  '20261010110658_private_evidence_storage_gate.sql'
 ]);
 for(const name of names){
  const sql=await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
  assert.doesNotMatch(sql,/create table(?: if not exists)? public\.learning_assignments\b/i,name);
 }
});
test('database integration does not authorize production deployment',async()=>{
 const gate=await readFile(new URL('../docs/agent-os/COMPANY-PORTAL-GATE-2026-10-07.md',import.meta.url),'utf8');
 assert.match(gate,/20261007165639_unified_learner_context/);
 assert.match(gate,/Production deployment remains blocked by MVP Gate/);
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(pkg.scripts).sort(),['build','check']);
 const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(build,/child_process|\bfetch\s*\(|\bexec(?:Sync|File)?\s*\(|\bspawn\s*\(/);
});
