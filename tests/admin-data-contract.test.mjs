import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adminFixture} from './helpers/browser-script.mjs';

const runtime=await readFile(new URL('../admin/admin-runtime.js',import.meta.url),'utf8');
const live=await readFile(new URL('../admin/admin-live.js',import.meta.url),'utf8');
const data=await readFile(new URL('../admin/admin-data.mjs',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('admin access fails closed when access context cannot be verified',async()=>{
  const ui=await adminFixture([{accessible:true,roles:[{code:'SA'}]}],{accessError:true});
  assert.equal(ui.events.length,0);
  assert.equal(ui.document.body.dataset.platformRole,undefined);
  assert.equal(ui.document.querySelector('.admin-shell').hidden,'');
  assert.match(ui.document.body.children[0].children[0].textContent,/تعذر فتح إدارة كفو/);
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
