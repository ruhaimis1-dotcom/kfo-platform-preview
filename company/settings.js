import { createClient } from '@supabase/supabase-js';
import { loadCompanySettings, saveCompanyName } from './settings-data.mjs';
const client = createClient('https://ktkdcfxeaicbykdurlfg.supabase.co', 'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
const organizationId = new URL(location.href).searchParams.get('organization');
const form = document.getElementById('settings'), input = document.getElementById('company-name');
const message = document.getElementById('message'), retry = document.getElementById('retry');
let current, busy = false, generation = 0;
function show(text, kind = 'info') { message.textContent = text; message.dataset.kind = kind; }
function lock(value) { busy = value; for (const control of form.elements) control.disabled = value; }
async function load() {
  const attempt = ++generation; form.hidden = true; current = null; retry.classList.add('hidden');
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId || '')) throw new Error('invalid-organization');
    const data = await loadCompanySettings(client, organizationId);
    if (attempt !== generation) return;
    if (data.kind === 'signed-out') return location.replace('/login');
    if (data.kind !== 'ready') return show('لا تملك صلاحية إدارة إعدادات هذه الشركة.', 'error');
    current = data; input.value = data.membership.name; form.hidden = false; lock(false);
    show('يمكنك تعديل اسم الشركة وحفظه.');
  } catch { if (attempt === generation) { show('تعذر تحميل إعدادات الشركة. حاول مجددًا.', 'error'); retry.classList.remove('hidden'); } }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy || !current) return;
  const attempt = generation, userId = current.userId; lock(true); show('جارٍ حفظ التغييرات…');
  try {
    const saved = await saveCompanyName(client, organizationId, userId, input.value);
    if (attempt !== generation) return;
    current = saved; input.value = saved.membership.name; show('تم حفظ اسم الشركة والتحقق منه.', 'success');
  } catch (error) {
    if (attempt !== generation) return;
    show(error.message === 'invalid-name' ? 'أدخل اسمًا بين حرفين و120 حرفًا.' : 'تعذر تأكيد الحفظ. أعد التحقق من الاسم المحفوظ قبل المحاولة مجددًا.', 'error');
    form.hidden = true; current = null; retry.classList.remove('hidden');
  } finally { if (attempt === generation) lock(false); }
});
document.getElementById('reset').addEventListener('click', () => { if (current) input.value = current.membership.name; });
retry.addEventListener('click', load);
window.addEventListener('beforeunload', event => { if (busy || (current && input.value !== current.membership.name)) { event.preventDefault(); event.returnValue = ''; } });
client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { generation++; current = null; form.hidden = true; input.value = ''; location.replace('/login'); } });
load();
