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
let generation = 0;
async function render() {
  const attempt = ++generation;
  retry.classList.add('hidden');
  list.replaceChildren();
  learner.classList.add('hidden');
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
          link('/business/dashboard','دخول مساحة الشركة',true),
          link('/business/employees','الموظفون'),
          link('/business/assignments','إسناد التدريب'),
          link('/business/reports','التقارير'),
          link('/business/settings','ملف الشركة والإعدادات')
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
      learner.classList.remove('hidden');
      const metricLabels={total:'إجمالي الدورات',personal:'دوراتي الشخصية',organization:'دورات جهة العمل',active:'قيد التعلم',completed:'مكتملة',certificates:'الشهادات',unread_notifications:'إشعارات جديدة'};
      for(const key of Object.keys(metricLabels)){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=String(home.dashboard[key]??0);const p=document.createElement('p');p.textContent=metricLabels[key];card.append(h,p);stats.append(card)}
      {const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=home.profile?.display_name||data.email||'متدرب كفو';const p=document.createElement('p');p.textContent=home.profile?.headline||'ملف التعلم الخاص بك';card.append(h,p);profile.append(card);profileName.value=home.profile?.display_name||'';profileHeadline.value=home.profile?.headline||'';profileForm.classList.remove('hidden')}
      if(!home.notifications.length){const card=document.createElement('article');card.className='portal-card';card.textContent='لا توجد إشعارات جديدة.';notifications.append(card)}
      for(const n of home.notifications){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=n.title;const p=document.createElement('p');p.textContent=n.body;card.append(h,p);if(!n.read_at){const b=document.createElement('button');b.type='button';b.textContent='تحديد كمقروء';b.addEventListener('click',async()=>{b.disabled=true;try{await markNotificationRead(client,n.id);b.remove()}catch{b.disabled=false}});card.append(b)}notifications.append(card)}
      if(!home.certificates.length){const card=document.createElement('article');card.className='portal-card';card.textContent='ستظهر شهاداتك هنا بعد إكمال متطلبات الدورات.';certificates.append(card)}
      for(const c of home.certificates){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=c.certificate_code;const p=document.createElement('p');p.textContent='صدرت '+new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(c.issued_at));card.append(h,p);certificates.append(card)}
      const organizationEnrollments = home.enrollments.filter((e) => e.context_type === 'organization');
      const personalEnrollments = home.enrollments.filter((e) => e.context_type === 'personal');
      for (const membership of memberships.filter((m) => m.accessible && m.roles.some((r) => r.code === 'EM'))) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); h.textContent=membership.name;
        const p=document.createElement('p'); p.className='state'; p.textContent='عضوية جهة نشطة';
        card.append(h,p); companies.append(card);
      }
      const all=[...organizationEnrollments,...personalEnrollments];
      if (!all.length) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); h.textContent='لا توجد دورات نشطة حاليًا';
        const p=document.createElement('p'); p.textContent='يمكنك البدء بدورة مجانية، أو ستظهر هنا أي دورة تكلفك بها جهة عملك.'; card.append(h,p); assignments.append(card);
      }
      for (const item of all) {
        const card=document.createElement('article'); card.className='portal-card';
        const h=document.createElement('h3'); h.textContent=item.course_slug;
        const p=document.createElement('p'); p.className='state'; p.textContent=item.context_type === 'personal' ? 'دورة شخصية' : 'دورة جهة العمل';
        const due=document.createElement('p'); due.textContent=item.due_at ? 'الموعد: '+new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(item.due_at)) : (item.context_type==='organization'?'بدون موعد نهائي':'تعلم بالوتيرة التي تناسبك');
        card.append(h,p,due); assignments.append(card);
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
    message.textContent = 'تعذر تحميل عضوياتك الآن. حاول مجددًا.';
    retry.classList.remove('hidden');
  }
}
profileForm.addEventListener('submit',async(event)=>{event.preventDefault();const button=profileForm.querySelector('button[type="submit"]');button.disabled=true;profileStatus.textContent='جارٍ الحفظ…';try{await updateMyProfile(client,{displayName:profileName.value,headline:profileHeadline.value});profileStatus.textContent='تم حفظ الملف.'}catch(error){profileStatus.textContent=error.message||'تعذر حفظ الملف.'}finally{button.disabled=false}});
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
