import {loadPortalImageUrls,applyPortalImages} from '../company/portal-brand-images.mjs';
import {loadPortalBranding,applyPortalBranding} from '../company/portal-branding.mjs';
import {inviteEmployee} from '../company/employee-invitation.mjs';
import {mountReportExport} from './report-export.mjs';
import {mountCompanySettings} from '../company/settings-live.mjs';
import {mountCourseOrders} from '../commerce/course-orders.mjs';
import {createClient} from '@supabase/supabase-js';
import {loadAssignableCourses,renderAssignableLibrary} from './course-library-data.mjs';
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
      ? 'البيانات محدثة حسب صلاحياتك في هذه الشركة.'
      : kind==='error'
        ? 'تعذر تحميل بيانات الشركة الفعلية. لم نعرض بيانات توضيحية بدلًا منها.'
        : 'جارٍ تحديث بيانات الشركة…';
  });
  if(message){
    emit('kfo:company-error',{message});
    const main=document.querySelector('main');
    if(main&&!main.querySelector('.company-live-error')){
      [...main.children].forEach(child=>child.hidden=true);
      const state=document.createElement('section');
      state.className='company-live-error';
      const h=document.createElement('h1');h.textContent='تعذر تحميل بيانات الشركة';
      const p=document.createElement('p');p.textContent=message;
      const a=document.createElement('a');a.href=location.pathname+location.search;a.textContent='إعادة المحاولة';
      state.append(h,p,a);main.append(state);
    }
  }
}
async function start(context){
  if(!context?.organizationId||startedFor===context.organizationId)return;
  startedFor=context.organizationId;
  setLiveState('loading');
  try{
    try{const branding=await loadPortalBranding(client,context.organizationId);applyPortalBranding({document,organizationId:context.organizationId,branding});
      try{const urls=await loadPortalImageUrls(client,context.organizationId,branding);applyPortalImages({document,organizationId:context.organizationId,urls})}catch{/* Keep text fallback if an image cannot be verified. */}}catch{/* Keep the approved KFO defaults if branding cannot be verified. */}
    const page=document.querySelector('main')?.dataset?.page||location.pathname.split('/').pop();
    if(page==='dashboard'||location.pathname.endsWith('/dashboard')){
      emit('kfo:company-dashboard',{data:await loadCompanyDashboard(client,context.organizationId),context});
    }
    if(page==='employees'||location.pathname.endsWith('/employees')||page==='assignments'||location.pathname.endsWith('/assignments')){
      const [members,courses]=await Promise.all([loadCompanyMembers(client,context.organizationId),page==='assignments'?loadAssignableCourses(client,context.organizationId):Promise.resolve([])]);
      emit('kfo:company-members',{data:members,courses,context});
    }
    if(page==='reports'||location.pathname.endsWith('/reports')){
      const [report,certificates]=await Promise.all([
        loadCompanyTrainingReport(client,context.organizationId),
        loadCompanyCertificates(client,context.organizationId)
      ]);
      emit('kfo:company-report',{report,certificates,context});
      mountReportExport({document,client,organizationId:context.organizationId});
    }
    if(page==='courses'){
      const [report,courses]=await Promise.all([loadCompanyTrainingReport(client,context.organizationId),loadAssignableCourses(client,context.organizationId)]);
      renderAssignableLibrary(document,courses);
      const totals=report.reduce((t,r)=>({total:t.total+Number(r.total_assignments||0),active:t.active+Number(r.active_assignments||0),completed:t.completed+Number(r.completed_assignments||0)}),{total:0,active:0,completed:0});
      const summary=totals;
      for(const key of ['total','active','completed']){
        const metric=document.querySelector('[data-course-count="'+key+'"]');
        if(metric)metric.textContent=summary[key].toLocaleString('ar-SA');
      }
    }
    if(page==='orders'){if(!context.canManageSettings)throw new Error('طلبات الشركة متاحة لمسؤول الشركة فقط.');const {data,error}=await client.auth.getUser();if(error||!data?.user)throw new Error('تعذر التحقق من الحساب.');await mountCourseOrders({document,client,userId:data.user.id,organizationId:context.organizationId,storage:sessionStorage,generate:()=>crypto.randomUUID()})}
    if(page==='settings')await mountCompanySettings({document,client,context});
    const supported=['settings','orders','dashboard','employees','assignments','reports','courses'];
    const normalized=location.pathname.split('/').pop()||page;
    if(supported.includes(page)||supported.includes(normalized)) setLiveState('ready');
    else {
      document.body.dataset.companyDataState='partial';
      document.querySelectorAll('.preview-note').forEach(note=>{
        note.textContent=normalized==='settings'
          ? 'اسم الشركة مرتبط بحسابك. بقية الإعدادات المعروضة قيد التجهيز ولا تُحفظ.'
          : 'هذا القسم قيد التجهيز، والإعدادات الظاهرة فيه للمعاينة فقط.';
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
    name:document.body.dataset.companyName,
    canManageSettings:document.body.dataset.companySettingsManage==='true',
    roles:(document.body.dataset.companyRole||'').split(',').filter(Boolean)
  });
}

window.kfoAssignCompanyCourse=async function(payload){
  const organizationId=document.body.dataset.organizationId;
  if(!organizationId)throw new Error('تعذر تحديد الشركة الحالية.');
  return assignCompanyCourse(client,{...payload,organizationId});
};

window.kfoInviteEmployee=async function(email){
 const organizationId=document.body.dataset.organizationId;
 if(!organizationId)throw Error('تعذر تحديد الشركة الحالية.');
 const id=await inviteEmployee(client,{organizationId,email,isCurrent:()=>document.body.dataset.organizationId===organizationId});
 try{emit('kfo:company-members',{data:await loadCompanyMembers(client,organizationId),courses:[],context:{organizationId}})}catch{throw Error('تم إنشاء الدعوة، وتعذر تحديث القائمة. أعد تحميل الصفحة؛ لا يلزم إنشاء دعوة أخرى.');}
 return id;
};
