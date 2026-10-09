import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('../admin/admin-runtime.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('admin workspace is SA-only',()=>{
  assert.match(runtime,/roles\.has\('SA'\)/);
  assert.match(runtime,/لا تملك صلاحية إدارة كفو/);
  assert.doesNotMatch(runtime,/roles\.has\('CO'\)|roles\.has\('BM'\)/);
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
