import { createClient } from '@supabase/supabase-js';
import { loadWorkspace } from './workspace-data.mjs';
import { loadAccessContext, attachAccessContext } from './access-context.mjs';
import { canManageSettings } from '../company/settings-data.mjs';
import { loadLearnerHome } from './learner-home-data.mjs';
const client = createClient('https://ktkdcfxeaicbykdurlfg.supabase.co', 'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
const message = document.getElementById('message');
const list = document.getElementById('memberships');
const retry = document.getElementById('retry');
const signout = document.getElementById('signout');
const learner=document.getElementById('learner');
const companies=document.getElementById('companies');
const assignments=document.getElementById('assignments');
const stats=document.getElementById('stats'), profile=document.getElementById('profile'), notifications=document.getElementById('notifications'), certificates=document.getElementById('certificates');
let generation = 0;
async function render() {
  const attempt = ++generation;
  retry.classList.add('hidden');
  list.replaceChildren();
  learner.classList.add('hidden'); companies.replaceChildren(); assignments.replaceChildren(); stats.replaceChildren(); profile.replaceChildren(); notifications.replaceChildren(); certificates.replaceChildren();
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
    const hasLearning = Boolean(home.profile) || home.enrollments.length > 0 || memberships.some((m) => m.accessible && m.roles.some((r) => r.code === 'EM'));
    if (hasLearning) {
      learner.classList.remove('hidden');
      const metricLabels={total:'إجمالي الدورات',personal:'دوراتي الشخصية',organization:'دورات جهة العمل',active:'قيد التعلم',completed:'مكتملة',certificates:'الشهادات',unread_notifications:'إشعارات جديدة'};
      for(const key of Object.keys(metricLabels)){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=String(home.dashboard[key]??0);const p=document.createElement('p');p.textContent=metricLabels[key];card.append(h,p);stats.append(card)}
      {const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=home.profile?.display_name||data.email||'متدرب كفو';const p=document.createElement('p');p.textContent=home.profile?.headline||'ملف التعلم الخاص بك';card.append(h,p);profile.append(card)}
      if(!home.notifications.length){const card=document.createElement('article');card.className='portal-card';card.textContent='لا توجد إشعارات جديدة.';notifications.append(card)}
      for(const n of home.notifications){const card=document.createElement('article');card.className='portal-card';const h=document.createElement('h3');h.textContent=n.title;const p=document.createElement('p');p.textContent=n.body;card.append(h,p);notifications.append(card)}
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
    message.textContent = hasLearning ? 'تم تحميل ملفك التعليمي.' : data.memberships.length ? 'تم التحقق من حسابك. هذه حالة عضوياتك الآن.' : 'لا توجد عضوية شركة مرتبطة بحسابك حاليًا.';
    if (!hasLearning) {
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
      note.textContent = membership.accessible ? 'تم تفعيل عضويتك. صفحات العمل والتعلّم ما زالت في مرحلة الربط.'
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
      // QA is only a diagnostic link for the existing isolated fixture organization.
      if (membership.organizationId === 'aa7a54d0-9bce-455d-adb4-971c21d9fdf1') {
        const link = document.createElement('a');
        link.href = '/auth-check'; link.textContent = 'فحص الصلاحيات';
        card.append(link);
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
