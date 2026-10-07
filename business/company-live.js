import {createClient} from '@supabase/supabase-js';
import {
  loadCompanyDashboard,loadCompanyMembers,loadCompanyTrainingReport,
  loadCompanyCertificates,assignCompanyCourse
} from './company-data.mjs';

const client=createClient(
  'https://ktkdcfxeaicbykdurlfg.supabase.co',
  'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF'
);

let startedFor=null;
function emit(name,detail){window.kfoCompanyLive=window.kfoCompanyLive||{};window.kfoCompanyLive[name]=detail;window.dispatchEvent(new CustomEvent(name,{detail}))}
function setLiveState(kind,message=''){
  document.body.dataset.companyDataState=kind;
  document.querySelectorAll('.preview-note').forEach(note=>{
    note.textContent=kind==='ready'
      ? 'بوابة شركة محمية • البيانات المعروضة مرتبطة بسياق الشركة الحالي.'
      : kind==='error'
        ? 'تعذر تحميل بيانات الشركة الفعلية. لم نعرض بيانات توضيحية بدلًا منها.'
        : 'جارٍ تحميل بيانات الشركة…';
  });
  if(message) emit('kfo:company-error',{message});
}
async function start(context){
  if(!context?.organizationId||startedFor===context.organizationId)return;
  startedFor=context.organizationId;
  setLiveState('loading');
  try{
    const page=document.querySelector('main')?.dataset?.page||location.pathname.split('/').pop();
    if(page==='dashboard'||location.pathname.endsWith('/dashboard')){
      emit('kfo:company-dashboard',{data:await loadCompanyDashboard(client,context.organizationId),context});
    }
    if(page==='employees'||location.pathname.endsWith('/employees')||page==='assignments'||location.pathname.endsWith('/assignments')){
      emit('kfo:company-members',{data:await loadCompanyMembers(client,context.organizationId),context});
    }
    if(page==='reports'||location.pathname.endsWith('/reports')){
      const [report,certificates]=await Promise.all([
        loadCompanyTrainingReport(client,context.organizationId),
        loadCompanyCertificates(client,context.organizationId)
      ]);
      emit('kfo:company-report',{report,certificates,context});
    }
    const supported=['dashboard','employees','assignments','reports'];
    const normalized=location.pathname.split('/').pop()||page;
    if(supported.includes(page)||supported.includes(normalized)) setLiveState('ready');
    else {
      document.body.dataset.companyDataState='partial';
      document.querySelectorAll('.preview-note').forEach(note=>{
        note.textContent='بوابة شركة محمية • هذه الصفحة ما زالت معاينة حتى تكتمل بوابة البيانات الخاصة بها.';
      });
    }
  }catch(error){
    setLiveState('error',error?.message||'تعذر تحميل بيانات الشركة.');
  }
}
window.addEventListener('kfo:company-context',event=>start(event.detail));
if(document.body.dataset.organizationId){
  start({
    organizationId:document.body.dataset.organizationId,
    membershipId:document.body.dataset.membershipId,
    roles:(document.body.dataset.companyRole||'').split(',').filter(Boolean)
  });
}

window.kfoAssignCompanyCourse=async function(payload){
  const organizationId=document.body.dataset.organizationId;
  if(!organizationId)throw new Error('تعذر تحديد الشركة الحالية.');
  return assignCompanyCourse(client,{...payload,organizationId});
};
