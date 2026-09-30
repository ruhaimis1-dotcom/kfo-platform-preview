import { createClient } from '@supabase/supabase-js';
import { authErrorMessage } from '../auth/validation.mjs';
import { KFO_URL, KFO_KEY, FIXTURES, runInvitationChecks, runAnonymousCheck } from './invitation-checks.mjs';

const client = createClient(KFO_URL, KFO_KEY, { auth: { detectSessionInUrl: false, persistSession: true } });
const form = document.getElementById('qa-login');
const sessionPanel = document.getElementById('session');
const message = document.getElementById('message');
const run = document.getElementById('run');
const signout = document.getElementById('signout');
const results = document.getElementById('results');
let identity = null;
function status(kind, text) { message.dataset.kind = kind; message.textContent = text; }
async function refreshIdentity() {
  run.disabled = true;
  identity = null;
  const { data, error } = await client.auth.getUser();
  const user = !error && data?.user;
  form.classList.toggle('hidden', Boolean(user));
  sessionPanel.classList.toggle('hidden', !user);
  if (!user) return status('info', 'سجّل الدخول بحساب الاختبار للبدء.');
  document.getElementById('identity').textContent = `الحساب: ${user.email}`;
  const fixture = Object.hasOwn(FIXTURES, user.id) ? FIXTURES[user.id] : null;
  if (!fixture) return status('error', 'هذا الحساب خارج مجموعة الاختبار. يمكنك تسجيل الخروج وتجربة حساب الاختبار.');
  identity = user.id;
  run.disabled = false;
  status('info', `تم التحقق من الدخول. دور الاختبار المتوقع: ${fixture.label}. الصلاحيات ستُختبر بطلبات حقيقية.`);
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button');
  button.disabled = true;
  status('info', 'جارٍ التحقق من بيانات الدخول…');
  try {
    const { error } = await client.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.password.value });
    form.elements.password.value = '';
    if (error) throw error;
    await refreshIdentity();
  } catch (error) { status('error', authErrorMessage(error, 'login')); }
  finally { form.elements.password.value = ''; button.disabled = false; }
});
run.addEventListener('click', async () => {
  run.disabled = true;
  signout.disabled = true;
  results.replaceChildren();
  status('info', 'جارٍ الفحص. ستظهر كل نتيجة بعد وصول استجابة كفو…');
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) throw new Error('انتهت الجلسة. سجّل الدخول مجددًا.');
    const report = await runInvitationChecks({ userId: identity, accessToken: data.session.access_token, onResult: (row) => {
      const li = document.createElement('li');
      li.dataset.passed = String(row.passed);
      li.textContent = `${row.passed ? 'نجح' : 'لم ينجح'} — ${row.label} (HTTP ${row.status})`;
      results.append(li);
    } });
    status('success', `اكتملت ${report.results.length} فحوص HTTP لهذا الحساب. ${report.initialStatus === 'invited' ? 'قُبلت الدعوة وأصبحت العضوية نشطة.' : 'كانت العضوية نشطة؛ اختُبرت إعادة الطلب فقط.'} يلزم الآن فحص سجل التدقيق في قاعدة البيانات.`);
  } catch (error) {
    status('error', error instanceof TypeError || error?.name === 'TimeoutError'
      ? 'تعذر الوصول إلى خدمة كفو. قد يكون طلب سابق اكتمل؛ أعد الفحص للتحقق من الحالة.'
      : error.message || 'توقف الفحص. النتائج المكتملة أعلاه لا تعني اكتمال البوابة.');
  } finally { run.disabled = false; signout.disabled = false; }
});
signout.addEventListener('click', async () => {
  signout.disabled = true;
  try {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    results.replaceChildren();
    await refreshIdentity();
  } catch { status('error', 'تعذر تسجيل الخروج. حاول مجددًا.'); }
  finally { signout.disabled = false; }
});
refreshIdentity().catch(() => status('error', 'تعذر التحقق من الجلسة. حاول تحديث الصفحة.'));
document.getElementById('anonymous').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const connection = document.getElementById('connection');
  button.disabled = true;
  connection.dataset.kind = 'info';
  connection.textContent = 'جارٍ التحقق من الاتصال…';
  try {
    const result = await runAnonymousCheck();
    connection.dataset.kind = result.passed ? 'success' : 'error';
    connection.textContent = result.passed
      ? `وصل الطلب إلى كفو ورُفض الوصول دون دخول (HTTP ${result.status} / 42501). فحص الجلسة والدعوة لم يُنفّذ بعد.`
      : `لم يتحقق الرفض المتوقع (HTTP ${result.status}). لا يُعد الفحص ناجحًا.`;
  } catch {
    connection.dataset.kind = 'error';
    connection.textContent = 'تعذر الوصول إلى كفو. حاول مجددًا بعد قليل.';
  } finally { button.disabled = false; }
});
