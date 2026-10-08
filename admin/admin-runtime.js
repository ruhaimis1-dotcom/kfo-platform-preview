import {createClient} from '@supabase/supabase-js';
import {loadWorkspace} from '../auth/workspace-data.mjs';
import {loadAccessContext,attachAccessContext} from '../auth/access-context.mjs';

const client=createClient(
  'https://ktkdcfxeaicbykdurlfg.supabase.co',
  'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF'
);

function fail(title,copy){
  document.body.classList.remove('admin-guard-pending');
  document.querySelector('.admin-shell')?.setAttribute('hidden','');
  const main=document.createElement('main');
  main.className='admin-guard-state';
  const h=document.createElement('h1');h.textContent=title;
  const p=document.createElement('p');p.textContent=copy;
  const a=document.createElement('a');a.href='/workspace';a.textContent='العودة إلى كفو';
  main.append(h,p,a);document.body.append(main);
}
function roleCodes(membership){return new Set((membership.roles||[]).map(r=>r.code))}
async function main(){
  const workspace=await loadWorkspace(client);
  if(workspace.kind==='signed-out'){location.replace('/login?next='+encodeURIComponent(location.pathname));return}
  const access=await loadAccessContext(client);
  if(access.kind!=='ready')throw new Error('تعذر التحقق من الجلسة.');
  const memberships=attachAccessContext(workspace,access);
  const platformAdmin=memberships.find(m=>m.accessible&&roleCodes(m).has('SA'));
  if(!platformAdmin){fail('لا تملك صلاحية إدارة كفو','لوحة إدارة المنصة مخصصة لمسؤولي كفو المخولين فقط.');return}
  document.body.dataset.platformRole='SA';
  document.querySelectorAll('[data-admin-name]').forEach(el=>el.textContent=workspace.email||'مسؤول كفو');
  document.body.classList.remove('admin-guard-pending');
  window.dispatchEvent(new CustomEvent('kfo:admin-context',{detail:{userId:workspace.userId,email:workspace.email,role:'SA'}}));
}
main().catch(()=>fail('تعذر فتح إدارة كفو','أعد تسجيل الدخول ثم حاول مرة أخرى.'));
