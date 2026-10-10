import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {workspaceFixture} from './helpers/browser-script.mjs';

const workspace=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
const page=await readFile(new URL('../auth/workspace.html',import.meta.url),'utf8');
const login=await readFile(new URL('../auth/login.html',import.meta.url),'utf8');

test('single company admin without learner context goes directly to company dashboard',async()=>{
  for(const code of ['CO','BM']){
    const ui=await workspaceFixture([{accessible:true,name:'QA company',organizationId:'org-1',roles:[{code}]}]);
    assert.equal(ui.redirects[0],'/business/dashboard?org=org-1',code);
  }
});

test('company routing preserves learner context and excludes inaccessible companies',async()=>{
  const membership={accessible:true,name:'QA company',organizationId:'org-1',roles:[{code:'CO'}]};
  const learner=await workspaceFixture([membership],{profile:{display_name:'Learner'}});
  assert.equal(learner.redirects.length,0);
  assert.equal(learner.get('learner').classList.contains('hidden'),false);
  const denied=await workspaceFixture([{...membership,accessible:false}]);
  assert.equal(denied.redirects.length,0);
  assert.equal(denied.get('company-admins').children.length,0);
});

test('platform admin routing takes precedence and multiple companies use switchboard',async()=>{
  const membership={accessible:true,name:'QA company',organizationId:'org-1',roles:[{code:'CO'},{code:'SA'}]};
  const admin=await workspaceFixture([membership]);
  assert.equal(admin.redirects[0],'/admin/dashboard');
  const multi=await workspaceFixture([{...membership,roles:[{code:'CO'}]},{...membership,organizationId:'org-2',roles:[{code:'BM'}]}]);
  assert.equal(multi.redirects.length,0);
  assert.equal(multi.get('company-admins').children.length,2);
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
