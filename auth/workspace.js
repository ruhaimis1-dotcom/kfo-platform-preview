import { createClient } from '@supabase/supabase-js';
import { loadWorkspace } from './workspace-data.mjs';
const client = createClient('https://ktkdcfxeaicbykdurlfg.supabase.co', 'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
const message = document.getElementById('message');
const list = document.getElementById('memberships');
const retry = document.getElementById('retry');
const signout = document.getElementById('signout');
let generation = 0;
async function render() {
  const attempt = ++generation;
  retry.classList.add('hidden');
  list.replaceChildren();
  document.getElementById('identity').textContent = '';
  message.dataset.kind = 'info';
  message.textContent = 'جارٍ التحقق من حسابك وعضوياتك…';
  try {
    const data = await loadWorkspace(client);
    if (attempt !== generation) return;
    if (data.kind === 'signed-out') return window.location.replace('/login');
    document.getElementById('identity').textContent = data.email || '';
    message.dataset.kind = data.memberships.length ? 'success' : 'info';
    message.textContent = data.memberships.length ? 'تم التحقق من حسابك. هذه حالة عضوياتك الآن.' : 'لا توجد عضوية شركة مرتبطة بحسابك حاليًا.';
    for (const membership of data.memberships) {
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
      // QA is only a diagnostic link for the existing isolated fixture organization.
      if (membership.organizationId === 'aa7a54d0-9bce-455d-adb4-971c21d9fdf1') {
        const link = document.createElement('a');
        link.href = '/auth-check'; link.textContent = 'فحص حساب شركة الاختبار';
        card.append(link);
      }
      list.append(card);
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
