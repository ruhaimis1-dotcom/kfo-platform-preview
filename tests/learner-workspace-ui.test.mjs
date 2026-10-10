import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import {workspaceFixture} from './helpers/browser-script.mjs';
const html=await readFile(new URL('../auth/workspace.html',import.meta.url),'utf8');const js=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
test('learner workspace contains MVP home surfaces',()=>{for(const id of ['stats','profile','companies','assignments','notifications','certificates'])assert.match(html,new RegExp('id="'+id+'"'))});
test('learner dashboard renders combined and context-specific metrics',()=>{for(const key of ['total','personal','organization','active','completed','certificates','unread_notifications'])assert.match(js,new RegExp(key+':'))});
test('technical membership cards are hidden when learner home is active',async()=>{
  const membership={accessible:true,name:'QA company',organizationId:'org-1',roles:[{code:'EM'}]};
  const ui=await workspaceFixture([membership]);
  assert.equal(ui.get('memberships').children.length,0);
  assert.equal(ui.get('learner').classList.contains('hidden'),false);
  assert.equal(ui.get('companies').children.length,1);
  const fallback=await workspaceFixture([{...membership,accessible:false,status:'invited'}]);
  assert.equal(fallback.get('memberships').children.length,1);
  assert.equal(fallback.get('learner').classList.contains('hidden'),true);
});
test('workspace loading copy is learner-neutral',()=>{assert.equal(js.includes('جارٍ التحقق من حسابك وعضوياتك'),false);assert.match(js,/جارٍ تحميل حسابك/)});
test('empty notification and certificate states are explicit',()=>{assert.match(js,/لا توجد إشعارات جديدة/);assert.match(js,/ستظهر شهاداتك هنا بعد إكمال متطلبات الدورات/)});
