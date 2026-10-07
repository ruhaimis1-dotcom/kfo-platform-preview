import {createClient} from '@supabase/supabase-js';
import {loadWorkspace} from '../auth/workspace-data.mjs';
import {loadAccessContext,attachAccessContext} from '../auth/access-context.mjs';

const client=createClient(
  'https://ktkdcfxeaicbykdurlfg.supabase.co',
  'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF'
);

function fail(title,copy){
  document.body.classList.remove('company-guard-pending');
  document.querySelector('.workspace')?.setAttribute('hidden','');
  const main=document.createElement('main');
  main.className='company-guard-state';
  const h=document.createElement('h1'); h.textContent=title;
  const p=document.createElement('p'); p.textContent=copy;
  const a=document.createElement('a'); a.href='/workspace'; a.textContent='العودة إلى مساحة كفو';
  main.append(h,p,a); document.body.append(main);
}
function roleCodes(membership){return new Set((membership.roles||[]).map(r=>r.code))}
function decorateNavigation(orgId){
  document.querySelectorAll('a[href^="/business/"]').forEach(anchor=>{
    const url=new URL(anchor.getAttribute('href'),location.origin);
    url.searchParams.set('org',orgId);
    anchor.setAttribute('href',url.pathname+url.search+url.hash);
  });
}
function showCompany(membership){
  document.body.dataset.organizationId=membership.organizationId;
  document.body.dataset.membershipId=membership.id;
  document.body.dataset.companyRole=[...roleCodes(membership)].join(',');
  document.querySelectorAll('.tenant strong').forEach(el=>el.textContent=membership.name);
  const avatar=document.querySelector('.tenant-avatar');
  if(avatar) avatar.textContent=(membership.name||'ش').trim().charAt(0)||'ش';
  document.querySelectorAll('.preview-note').forEach(note=>{
    note.textContent='يتم عرض هذه المساحة حسب صلاحيات حسابك في الشركة.';
  });
  decorateNavigation(membership.organizationId);
  sessionStorage.setItem('kfo.company.org',membership.organizationId);
  document.body.classList.remove('company-guard-pending');
  window.dispatchEvent(new CustomEvent('kfo:company-context',{detail:{
    organizationId:membership.organizationId,
    membershipId:membership.id,
    name:membership.name,
    roles:[...roleCodes(membership)]
  }}));
}
async function main(){
  const workspace=await loadWorkspace(client);
  if(workspace.kind==='signed-out'){location.replace('/login?next='+encodeURIComponent(location.pathname+location.search));return}
  const access=await loadAccessContext(client);
  if(access.kind!=='ready') throw new Error('تعذر التحقق من الجلسة.');
  const memberships=attachAccessContext(workspace,access);
  const allowed=memberships.filter(m=>{
    const roles=roleCodes(m);
    return m.accessible&&(roles.has('CO')||roles.has('BM')||roles.has('SA'));
  });
  if(!allowed.length){fail('لا تملك صلاحية مساحة الشركة','هذه المساحة متاحة لمسؤول الشركة أو المدير المخول فقط.');return}
  const params=new URLSearchParams(location.search);
  const requested=params.get('org')||sessionStorage.getItem('kfo.company.org');
  const selected=(requested&&allowed.find(m=>m.organizationId===requested))||allowed[0];
  if(requested&&!allowed.some(m=>m.organizationId===requested)){
    fail('تعذر فتح الشركة المطلوبة','عضويتك الحالية لا تسمح بفتح هذه الشركة.');return
  }
  showCompany(selected);
}
main().catch(()=>fail('تعذر التحقق من مساحة الشركة','أعد تسجيل الدخول ثم حاول مرة أخرى.'));