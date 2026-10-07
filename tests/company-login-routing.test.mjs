import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workspace=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
const page=await readFile(new URL('../auth/workspace.html',import.meta.url),'utf8');
const login=await readFile(new URL('../auth/login.html',import.meta.url),'utf8');

test('single company admin without learner context goes directly to company dashboard',()=>{
  assert.match(workspace,/companyAdminMemberships\.length===1&&!hasLearning/);
  assert.match(workspace,/window\.location\.replace\('\/business\/dashboard\?org='/);
});

test('company admin switchboard exposes primary company pages',()=>{
  for(const route of ['/business/dashboard','/business/employees','/business/assignments','/business/reports','/business/settings']){
    assert.equal(workspace.includes(route),true,route);
  }
  assert.equal(page.includes('company-workspace'),true);
  assert.equal(page.includes('مساحة الشركة'),true);
});

test('customer workspace no longer exposes QA permission check or stale linking message',()=>{
  assert.equal(workspace.includes('/auth-check'),false);
  assert.equal(workspace.includes('ما زالت في مرحلة الربط'),false);
  assert.equal(workspace.includes('فحص الصلاحيات'),false);
});

test('login copy promises role-aware destination without decorative arrow',()=>{
  assert.equal(login.includes('سنفتح المساحة المناسبة لدورك'),true);
  assert.equal(login.includes('→'),false);
});
