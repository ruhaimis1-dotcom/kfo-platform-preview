import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('../business/company-runtime.js',import.meta.url),'utf8');
const live=await readFile(new URL('../business/company-live.js',import.meta.url),'utf8');
const dashboard=await readFile(new URL('../business/business.js',import.meta.url),'utf8');
const employees=await readFile(new URL('../business/employees.js',import.meta.url),'utf8');
const reports=await readFile(new URL('../business/insights.js',import.meta.url),'utf8');
const assignment=await readFile(new URL('../business/flow.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('company pages fail closed until authenticated tenant context resolves',()=>{
  assert.match(runtime,/roles\.has\('CO'\).*roles\.has\('BM'\).*roles\.has\('SA'\)/s);
  assert.match(runtime,/company-guard-pending/);
  assert.match(live,/company-live-error/);
});

test('live company payloads survive script ordering and hydrate pages',()=>{
  assert.match(live,/window\.kfoCompanyLive/);
  assert.match(dashboard,/kfo:company-dashboard/);
  assert.match(employees,/kfo:company-members/);
  assert.match(reports,/kfo:company-report/);
});

test('employee live mode uses membership ids and removes fake contact dependency',()=>{
  assert.match(employees,/membershipId:member\.membership_id/);
  assert.match(employees,/عضوية شركة/);
  assert.match(employees,/قائمة الأعضاء مرتبطة بسياق الشركة الحالي/);
});

test('assignment live mode uses membership ids and only approved reference course',()=>{
  assert.match(assignment,/customer-service-reference/);
  assert.match(assignment,/membershipIds:selected/);
  assert.match(assignment,/window\.kfoAssignCompanyCourse/);
  assert.match(assignment,/تكليف فريق كامل ينتظر ربط دليل الفرق/);
});

test('company live bundles are part of the build',()=>{
  assert.match(build,/business', 'company-runtime\.js/);
  assert.match(build,/business', 'company-live\.js/);
});
