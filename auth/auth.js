import { createClient } from '@supabase/supabase-js';
import { authErrorMessage, passwordIssue } from './validation.mjs';

// This is a public browser key. Authorization must be enforced by Supabase RLS.
const supabase = createClient(
  'https://ktkdcfxeaicbykdurlfg.supabase.co',
  'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF',
  { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } },
);
const page = document.body.dataset.page;
const form = document.getElementById('auth-form');
const message = document.getElementById('message');
const submit = form.querySelector('button[type="submit"]');
const originalLabel = submit.textContent;

function showMessage(kind, value) {
  message.dataset.kind = kind;
  message.textContent = value;
}
function busy(value, label = 'جارٍ الإرسال…') {
  submit.disabled = value;
  submit.textContent = value ? label : originalLabel;
}

if (page === 'login') {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    busy(true, 'جارٍ تسجيل الدخول…');
    showMessage('info', 'جارٍ التحقق من بياناتك…');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
      });
      if (error) throw error;
      form.classList.add('hidden');
      showMessage('success', 'تم تسجيل الدخول بنجاح. مساحة العمل قيد التجهيز، وستظهر بعد تفعيل العضويات والصلاحيات.');
    } catch (error) {
      showMessage('error', authErrorMessage(error, 'login'));
    } finally {
      busy(false);
    }
  });
}

if (page === 'forgot') {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    busy(true);
    showMessage('info', 'جارٍ معالجة طلبك…');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.elements.email.value.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      form.classList.add('hidden');
      showMessage('success', 'إذا كان البريد مرتبطاً بحساب، فستصلك رسالة تحتوي على رابط الاستعادة. تحقق من صندوق الوارد والبريد غير المرغوب فيه.');
    } catch (error) {
      showMessage('error', authErrorMessage(error, 'forgot'));
    } finally {
      busy(false);
    }
  });
}

if (page === 'reset') {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const linkError = url.searchParams.get('error_description') || fragment.get('error_description');
  showMessage(linkError ? 'error' : 'info', linkError
    ? 'رابط الاستعادة غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.'
    : 'جارٍ التحقق من رابط الاستعادة…');
  let recoverySession = false;
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoverySession = true;
      form.classList.remove('hidden');
      showMessage('info', 'تم التحقق من الرابط. يمكنك تعيين كلمة مرور جديدة.');
      // Remove access tokens from the address bar after the SDK has consumed them.
      history.replaceState(null, '', '/reset-password');
    } else if (event === 'INITIAL_SESSION' && !recoverySession && !linkError) {
      showMessage('info', 'افتح رابط الاستعادة من بريدك الإلكتروني. إذا انتهت صلاحيته، اطلب رابطاً جديداً.');
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!recoverySession || !form.reportValidity()) return;
    const issue = passwordIssue(form.elements.password.value, form.elements.confirm.value);
    if (issue) return showMessage('error', issue);
    busy(true, 'جارٍ الحفظ…');
    showMessage('info', 'جارٍ حفظ كلمة المرور…');
    try {
      const { error } = await supabase.auth.updateUser({ password: form.elements.password.value });
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
      recoverySession = false;
      form.reset();
      form.classList.add('hidden');
      showMessage('success', 'تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول من صفحة الدخول.');
    } catch (error) {
      showMessage('error', authErrorMessage(error, 'reset'));
    } finally {
      busy(false);
    }
  });
}
