import {createClient} from '@supabase/supabase-js';
import {
  loadAdminOverview,loadAdminOrganizations,loadAdminMemberships,loadAdminCourses,
  loadAdminCertificates,loadAdminReviewQueue,loadAdminActivity
} from './admin-data.mjs';

const client=createClient(
  'https://ktkdcfxeaicbykdurlfg.supabase.co',
  'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF'
);

function showError(message){
  const host=document.querySelector('.admin-content');
  const status=document.querySelector('.admin-status');
  if(status){
    status.innerHTML='<strong>تعذر تحميل البيانات الحية:</strong> '+message;
    status.dataset.kind='error';
  }
  document.querySelectorAll('[data-live-block]').forEach(el=>el.hidden=true);
  if(host&&!host.querySelector('.admin-live-error')){
    const box=document.createElement('section');
    box.className='admin-section admin-live-error';
    box.innerHTML='<div class="admin-placeholder"><strong>البيانات غير متاحة الآن</strong><span></span></div>';
    box.querySelector('span').textContent=message;
    host.append(box);
  }
}
function n(value){return Number(value||0).toLocaleString('ar-SA')}
function fillOverview(data){
  const keys=['organizations','memberships','courses','certificates','pending_reviews','audit_events'];
  const cards=[...document.querySelectorAll('[data-admin-metric]')];
  cards.forEach((card,i)=>{const key=keys[i];if(key)card.textContent=n(data?.[key])});
}
function renderRows(tbody,rows,cells){
  tbody.replaceChildren();
  for(const row of rows){
    const tr=document.createElement('tr');
    for(const [label,field,format] of cells){
      const td=document.createElement('td');td.dataset.label=label;
      td.textContent=format?format(row[field],row):String(row[field]??'—');
      tr.append(td);
    }
    tbody.append(tr);
  }
}
async function start(){
  const page=location.pathname.split('/').pop()||'dashboard';
  try{
    if(page==='dashboard'){
      fillOverview(await loadAdminOverview(client));
    }else if(page==='organizations'){
      const rows=await loadAdminOrganizations(client);
      renderRows(document.querySelector('#admin-organizations'),rows,[
        ['الشركة','display_name'],['الحالة','tenant_access_enabled',v=>v?'نشطة':'متوقفة'],['العضويات','member_count',n]
      ]);
    }else if(page==='users'){
      const rows=await loadAdminMemberships(client);
      renderRows(document.querySelector('#admin-users'),rows,[
        ['الشركة','organization_name'],['المستخدم','display_name'],['الدور','role_code'],['الحالة','membership_status']
      ]);
    }else if(page==='content'){
      const rows=await loadAdminCourses(client);
      renderRows(document.querySelector('#admin-courses'),rows,[
        ['الدورة','course_slug'],['الإصدار','course_version',n],['الأنشطة','activity_count',n],['المهارات','skill_count',n]
      ]);
    }else if(page==='certificates'){
      const rows=await loadAdminCertificates(client);
      renderRows(document.querySelector('#admin-certificates'),rows,[
        ['الرمز','certificate_code'],['المتعلم','display_name'],['الدورة','course_slug'],['الحالة','revoked_at',v=>v?'ملغاة':'سارية']
      ]);
    }else if(page==='reviews'){
      const rows=await loadAdminReviewQueue(client);
      renderRows(document.querySelector('#admin-reviews'),rows,[
        ['المتعلم','display_name'],['الدورة','course_slug'],['النشاط','activity_key'],['الحالة','review_status']
      ]);
    }else if(page==='activity'){
      const rows=await loadAdminActivity(client);
      renderRows(document.querySelector('#admin-activity'),rows,[
        ['الحدث','event_type'],['الجهة','organization_name'],['المنفذ','actor_label'],['الوقت','created_at',v=>v?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—']
      ]);
    }
    const status=document.querySelector('.admin-status');
    if(status)status.innerHTML='<strong>بيانات حية:</strong> تم تحميل البيانات وفق صلاحية SA.';
  }catch(error){
    showError(error?.message||'تعذر تحميل بيانات إدارة كفو.');
  }
}
window.addEventListener('kfo:admin-context',start,{once:true});
if(document.body.dataset.platformRole==='SA')start();
