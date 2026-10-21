import {mountCertificateExport} from './certificate-export.mjs';
import {mountProfileEditor,markWorkspaceNotification} from './workspace-mutations.mjs';
import {loadCertificateDetails,renderCertificateDetails} from './certificate-details.mjs';
import {mountLearnerNavigation,enrollmentPresentation} from './workspace-navigation.mjs';
import { createClient } from '@supabase/supabase-js';
import { loadWorkspace } from './workspace-data.mjs';
import { loadAccessContext, attachAccessContext } from './access-context.mjs';
import { canManageSettings } from '../company/settings-data.mjs';
import { loadLearnerHome } from './learner-home-data.mjs';
import { updateMyProfile, markNotificationRead } from './learner-actions.mjs';
const client = createClient('https://ktkdcfxeaicbykdurlfg.supabase.co', 'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
const message = document.getElementById('message');
const list = document.getElementById('memberships');
const retry = document.getElementById('retry');
const signout = document.getElementById('signout');
const learner=document.getElementById('learner');
const companyWorkspace=document.getElementById('company-workspace');
const companyAdmins=document.getElementById('company-admins');
const workspaceBadge=document.getElementById('workspace-badge');
const workspaceTitle=document.getElementById('workspace-title');
const companies=document.getElementById('companies');
const assignments=document.getElementById('assignments');
const stats=document.getElementById('stats'), profile=document.getElementById('profile'), notifications=document.getElementById('notifications'), certificates=document.getElementById('certificates');
const profileForm=document.getElementById('profile-form'), profileName=document.getElementById('profile-name'), profileHeadline=document.getElementById('profile-headline'), profileStatus=document.getElementById('profile-status');
const learnerNavigation=mountLearnerNavigation({document,window});
let generation = 0,certificateRequest=0;
async function render() {
  const attempt = ++generation;
  retry.classList.add('hidden');profileStatus.textContent='';document.getElementById('notification-status').textContent='';
  list.replaceChildren();
  learner.classList.add('hidden');
  document.getElementById('certificate-details').replaceChildren();document.getElementById('certificate-details').hidden=true;
  companyWorkspace.classList.add('hidden');
  companyAdmins.replaceChildren();
  companies.replaceChildren(); assignments.replaceChildren(); stats.replaceChildren(); profile.replaceChildren(); notifications.replaceChildren(); certificates.replaceChildren(); profileForm.classList.add('hidden');
  workspaceBadge.textContent='حسابك في كفو';
  workspaceTitle.textContent='مساحتك في كفو';
  document.title='مساحتك في كفو — كفو';
  document.getElementById('identity').textContent = '';
  message.dataset.kind = 'info';
  message.textContent = 'جارٍ تحميل حسابك…';
  try {
    const data = await loadWorkspace(client);
    if (attempt !== generation) return;
    if (data.kind === 'signed-out') return window.location.replace('/login');
    const context = await loadAccessContext(client);
    if (attempt !== generation) return;
    if (context.kind === 'signed-out') return window.location.replace('/login');
    const memberships = attachAccessContext(data, context);
    document.getElementById('identity').textContent = data.email || '';
    const home = await loadLearnerHome(client, data.userId);
    if (attempt !== generation) return;
    if(home.kind==='signed-out')return window.location.replace('/login');

    const companyAdminMemberships=memberships.filter((m)=>m.accessible&&m.roles.some((r)=>['CO','BM','SA'].includes(r.code)));
    if(companyAdminMemberships.length){
      companyWorkspace.classList.remove('hidden');
      workspaceBadge.textContent='مساحة الشركة';
      workspaceTitle.textContent='أدر تطوير فريقك من مكان واحد';
      document.title='مساحة الشركة — كفو';
      const roleLabel=(membership)=>{
        const codes=new Set(membership.roles.map((r)=>r.code));
        if(codes.has('SA')) return 'إدارة المنصة';
        if(codes.has('CO')) return 'مالك الشركة';
        return 'مدير الفرع أو القسم';
      };
      for(const membership of companyAdminMemberships){
        const card=document.createElement('article');
        card.className='portal-card company-admin-card';
        const head=document.createElement('div');
        head.className='company-card-head';
        const h=document.createElement('h3');h.textContent=membership.name;
        const role=document.createElement('span');role.className='company-role';role.textContent=roleLabel(membership);
        head.append(h,role);
        const p=document.createElement('p');
        p.textContent='تابع الفريق، أسند التدريب، وراقب التقدم والشهادات.';
        const actions=document.createElement('div');
        actions.className='company-actions';
        const link=(href,label,primary=false)=>{
          const a=document.createElement('a');
          a.href=href+'?org='+encodeURIComponent(membership.organizationId);
          a.textContent=label;
          a.className=primary?'company-primary':'company-link';
          return a;
        };
        actions.append(
          link('/business/dashboard','دخول مساحة الشركة',true)
        );
        card.append(head,p,actions);
        companyAdmins.append(card);
      }
    }
    const hasLearning = Boolean(home.profile) || home.enrollments.length > 0 || memberships.some((m) => m.accessible && m.roles.some((r) => r.code === 'EM'));
    const hasPlatformAdmin=companyAdminMemberships.some((m)=>m.roles.some((r)=>r.code==='SA'));
    if(hasPlatformAdmin&&!hasLearning){
      window.location.replace('/admin/dashboard');
      return;
    }
    const companyOnlyMemberships=companyAdminMemberships.filter((m)=>m.roles.some((r)=>['CO','BM'].includes(r.code)));
    if(companyOnlyMemberships.length===1&&!hasLearning){
      const membership=companyOnlyMemberships[0];
      window.location.replace('/business/dashboard?org='+encodeURIComponent(membership.organizationId));
      return;
    }
    if (hasLearning) {
      learner.classList.remove('hidden');learnerNavigation.render();
      const metricLabels={total:'إجمالي الدورات',personal:'دوراتي الشخصية',organization:'دورات جهة العمل',active:'قيد التعلم',completed:'مكتملة',certificates:'الشهادات',unread_notifications:'إشعارات جديدة'};
      for(const key of Object.keys(metricLabels)){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=String(home.dashboard[key]??0);h.id='learner-metric-'+key;const p=document.createElement('p');p.textContent=metricLabels[key];card.append(h,p);stats.append(card)}
      {const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=home.profile?.display_name||data.email||'متدرب كفو';const p=document.createElement('p');p.textContent=home.profile?.headline||'ملف التعلم الخاص بك';card.append(h,p);profile.append(card);profileName.value=home.profile?.display_name||'';profileHeadline.value=home.profile?.headline||'';profileForm.classList.remove('hidden')}
      if(!home.notifications.length){const card=document.createElement('article');card.className='portal-card';card.textContent='لا توجد إشعارات جديدة.';notifications.append(card)}
      for(const n of home.notifications){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=n.title;const p=document.createElement('p');p.textContent=n.body;card.append(h,p);if(!n.read_at){const b=document.createElement('button');b.type='button';b.textContent='تحديد كمقروء';b.addEventListener('click',()=>markWorkspaceNotification({button:b,status:document.getElementById('notification-status'),counter:document.getElementById('learner-metric-unread_notifications'),read:()=>markNotificationRead(client,n.id),currentGeneration:()=>generation}));card.append(b)}notifications.append(card)}
      if(!home.certificates.length){const card=document.createElement('article');card.className='portal-card';card.textContent='ستظهر شهاداتك هنا بعد إكمال متطلبات الدورات.';certificates.append(card)}
      for(const c of home.certificates){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=c.certificate_code;const p=document.createElement('p');p.textContent='صدرت '+new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(c.issued_at));const button=document.createElement('button');button.type='button';button.textContent='عرض تفاصيل الشهادة';button.addEventListener('click',async()=>{const host=document.getElementById('certificate-details');host.replaceChildren();host.hidden=false;host.textContent='جارٍ التحقق من الشهادة…';button.disabled=true;const certificateGeneration=generation,request=++certificateRequest;try{const record=await loadCertificateDetails(client,c.id);if(certificateGeneration!==generation||request!==certificateRequest)return;host.textContent='';renderCertificateDetails({document,host,record});mountCertificateExport({document,host,client,id:c.id,isCurrent:()=>certificateGeneration===generation&&request===certificateRequest})}catch(error){if(certificateGeneration===generation&&request===certificateRequest){host.replaceChildren();host.textContent=error.message}}finally{button.disabled=false}});card.append(h,p,button);certificates.append(card)}
      const organizationEnrollments = home.enrollments.filter((e) => e.context_type === 'organization');
      const personalEnrollments = home.enrollments.filter((e) => e.context_type === 'personal');
      for (const membership of memberships.filter((m) => m.accessible && m.roles.some((r) => r.code === 'EM'))) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); h.textContent=membership.name;
        const p=document.createElement('p'); p.className='state'; p.textContent='عضوية جهة نشطة';
        card.append(h,p); companies.append(card);
      }
      if(!companies.children.length){const empty=document.createElement('article');empty.className='portal-card';empty.textContent='لا توجد جهة عمل نشطة مرتبطة بملفك. يمكنك التعلم بحسابك الشخصي.';companies.append(empty)}
      const all=[...organizationEnrollments,...personalEnrollments];
      if (!all.length) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); h.textContent='لم تسجل في دورة بعد';
        const p=document.createElement('p'); p.textContent='يمكنك البدء بدورة مجانية، أو ستظهر هنا أي دورة تكلفك بها جهة عملك.'; card.append(h,p); assignments.append(card);
      }
      for (const item of all) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); const info=enrollmentPresentation(item);h.textContent=info.title;
        const p=document.createElement('p'); p.className='state'; p.textContent=item.context_type === 'personal' ? 'دورة شخصية' : 'دورة جهة العمل';
        const due=document.createElement('p'); due.textContent=item.due_at ? 'الموعد: '+new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(item.due_at)) : (item.context_type==='organization'?'بدون موعد نهائي':'تعلم بالوتيرة التي تناسبك');
        const state=document.createElement('p');state.textContent=info.status;card.append(h,p,state,due);if(info.href){const a=document.createElement('a');a.href=info.href;a.className='catalog-link';a.textContent='متابعة التعلم';card.append(a)}else if(item.status==='active'){const note=document.createElement('p');note.textContent='هذه النسخة غير متاحة في مشغّل التعلم حاليًا. راجع مسؤول التدريب.';card.append(note)}assignments.append(card);
      }
    }
    message.dataset.kind = data.memberships.length ? 'success' : 'info';
    if(companyAdminMemberships.length){
      message.textContent='تم تحميل مساحة الشركة. اختر القسم الذي تريد إدارته.';
    }else if(hasLearning){
      workspaceBadge.textContent='بوابة التعلم';
      workspaceTitle.textContent='تعلّمك في مكان واحد';
      document.title='بوابة التعلم — كفو';
      message.textContent='تم تحميل ملفك التعليمي.';
    }else{
      message.textContent=data.memberships.length ? 'تم التحقق من حسابك. هذه حالة عضوياتك الآن.' : 'لا توجد عضوية شركة مرتبطة بحسابك حاليًا.';
    }
    if (!companyAdminMemberships.length && !hasLearning) {
    for (const membership of memberships) {
      const card = document.createElement('section');
      card.className = 'membership';
      const title = document.createElement('h2');
      title.textContent = membership.name;
      const state = document.createElement('p');
      state.className = 'state';
      state.textContent = membership.status === 'invited' ? 'الدعوة بانتظار القبول'
        : membership.accessible ? 'عضويتك نشطة' : 'الوصول إلى الشركة غير متاح حاليًا';
      const note = document.createElement('p');
      note.textContent = membership.accessible ? 'عضويتك مفعلة ويمكنك استخدام المساحات المتاحة لدورك.'
        : membership.status === 'invited' ? 'الدعوة لم تُفعّل بعد. قبول الدعوة وتسجيل الدخول خطوتان منفصلتان.' : 'راجع مسؤول الشركة بشأن حالة العضوية والوصول.';
      card.append(title, state, note);
      if (membership.accessible) {
        const roles = document.createElement('p');
        const labels = { CO: 'مالك الشركة', BM: 'مدير الفرع أو القسم', EM: 'موظف', FI: 'مسؤول مالي',
          IN: 'مدرّب', TC: 'مركز تدريب', CQ: 'مراجع جودة', PA: 'مسؤول الشريك', SU: 'متعلم مستقل' };
        roles.textContent = membership.roles.length ? `دورك: ${membership.roles.map((r) =>
          `${labels[r.code] || 'دور مرتبط بالعضوية'}${r.department_id ? ' — ضمن القسم المحدد' : r.branch_id ? ' — ضمن الفرع المحدد' : ''}`
        ).join('، ')}` : 'لا يوجد دور عمل مفعّل لهذه العضوية حاليًا.';
        card.append(roles);
        if (canManageSettings(membership)) {
          const settings = document.createElement('a');
          settings.href = `/company/settings?organization=${encodeURIComponent(membership.organizationId)}`;
          settings.textContent = 'إعدادات الشركة';
          card.append(settings);
        }
      }
      list.append(card);
    }
    }
    retry.classList.remove('hidden');
  } catch {
    if (attempt !== generation) return;
    message.dataset.kind = 'error';
    message.textContent = 'تعذر تحميل مساحة حسابك الآن. حاول مجددًا.';
    retry.classList.remove('hidden');
  }
}
mountProfileEditor({form:profileForm,name:profileName,headline:profileHeadline,status:profileStatus,profile,save:input=>updateMyProfile(client,input),currentGeneration:()=>generation});
retry.addEventListener('click', render);
signout.addEventListener('click', async () => {
  generation++;
  signout.disabled = true;
  try {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    list.replaceChildren();
    document.getElementById('identity').textContent = '';
    window.location.replace('/login');
  } catch { message.dataset.kind = 'error'; message.textContent = 'تعذر تسجيل الخروج. حاول مجددًا.'; }
  finally { signout.disabled = false; }
});
client.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    generation++;
    list.replaceChildren(); document.getElementById('identity').textContent = '';
    window.location.replace('/login');
  }
});
render();
