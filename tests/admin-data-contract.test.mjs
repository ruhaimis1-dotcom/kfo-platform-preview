import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('../admin/admin-runtime.js',import.meta.url),'utf8');
const live=await readFile(new URL('../admin/admin-live.js',import.meta.url),'utf8');
const data=await readFile(new URL('../admin/admin-data.mjs',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('admin access remains SA-only and fail closed',()=>{
  assert.match(runtime,/roles\.has\('SA'\)/);
  assert.match(runtime,/لا تملك صلاحية إدارة كفو/);
  assert.match(live,/showError/);
});

test('admin data adapter uses narrow RPCs',()=>{
  for(const name of [
    'admin_platform_overview','admin_organization_directory','admin_membership_directory',
    'admin_course_directory','admin_certificate_directory','admin_evidence_review_queue','admin_audit_log'
  ]) assert.equal(data.includes(name),true,name);
});

test('admin live controller does not query tables directly',()=>{
  assert.equal(/\.from\(/.test(live),false);
  assert.equal(/auth\.admin/.test(live),false);
});

test('admin live bundle is built',()=>{
  assert.match(build,/admin-live\.js/);
  assert.match(build,/admin-runtime\.js/);
});
