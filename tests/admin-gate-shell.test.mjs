import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adminFixture} from './helpers/browser-script.mjs';

const runtime=await readFile(new URL('../admin/admin-runtime.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const css=await readFile(new URL('../admin/admin.css',import.meta.url),'utf8');

test('admin workspace denies non-SA and inaccessible SA memberships',async()=>{
  for(const code of ['CO','BM','EM','FI','SU','SA']){
    const ui=await adminFixture([{accessible:code!=='SA',roles:[{code}]}]);
    assert.equal(ui.events.length,0,code);
    assert.equal(ui.document.body.dataset.platformRole,undefined,code);
    assert.equal(ui.document.querySelector('.admin-shell').hidden,'',code);
    assert.match(ui.document.body.children[0].children[0].textContent,/لا تملك صلاحية إدارة كفو/);
  }
});

test('denied admin shell stays hidden despite its grid layout',()=>{
  assert.match(css,/\.admin-shell\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/);
});

test('admin workspace admits accessible SA and redirects signed-out users',async()=>{
  const admin=await adminFixture([{accessible:true,roles:[{code:'SA'}]}]);
  assert.equal(admin.events[0].type,'kfo:admin-context');
  assert.equal(admin.events[0].detail.role,'SA');
  const guest=await adminFixture([],{signedOut:true});
  assert.equal(guest.redirects[0],'/login?next=%2Fadmin%2Fdashboard');
  assert.equal(guest.events.length,0);
});

test('platform admins are routed to admin workspace',()=>{
  assert.match(workspace,/hasPlatformAdmin/);
  assert.match(workspace,/window\.location\.replace\('\/admin\/dashboard'\)/);
});

test('admin MVP pages are part of build',()=>{
  for(const name of ['dashboard','organizations','users','content','certificates','reviews','activity']){
    assert.equal(build.includes(`['dashboard','organizations','users','content','certificates','reviews','activity']`),true);
    break;
  }
  assert.match(build,/admin-runtime\.js/);
  assert.match(build,/admin\.css/);
});

test('admin browser does not expose direct auth.users dependency',()=>{
  assert.equal(runtime.includes('auth.users'),false);
});
