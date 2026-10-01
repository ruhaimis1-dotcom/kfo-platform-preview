import { FIXTURES, QA_ORG, KFO_URL } from './invitation-checks.mjs';

// Reserved QA-only paths. This runner cannot target arbitrary customer assets.
export const ASSET_ORG_B = '71000000-0000-4000-8000-000000000002';
export const ASSET_MARKER = 'KFO-G1-PRIVATE-ASSET-20261001';
const paths = {
  [QA_ORG]: `${QA_ORG}/qa-g1-20261001/probe.txt`,
  [ASSET_ORG_B]: `${ASSET_ORG_B}/qa-g1-20261001/probe.txt`,
};
export async function runPrivateAssetChecks({ client, action = 'verify', onResult = () => {}, fetchImpl = fetch }) {
  const { data: auth, error: authError } = await client.auth.getUser();
  const userId = auth?.user?.id;
  const fixture = userId && Object.hasOwn(FIXTURES, userId) && FIXTURES[userId];
  if (authError || !fixture || !['prepare', 'verify', 'cleanup'].includes(action)) {
    throw new Error('يلزم الدخول بحساب اختبار كفو واختيار إجراء اختبار معتمد.');
  }
  // The separate QA-B setup assigns EM as CO in B only. Original A role is unchanged.
  const ownOrg = fixture.role === 'CO' ? QA_ORG : fixture.role === 'EM' ? ASSET_ORG_B : null;
  if (!ownOrg) throw new Error('هذا الفحص يحتاج مالك شركة الاختبار A أو B؛ فحص نطاق مدير الفرع مستقل.');
  const otherOrg = ownOrg === QA_ORG ? ASSET_ORG_B : QA_ORG;
  const { data: context, error: contextError } = await client.rpc('my_access_context');
  if (contextError || !Array.isArray(context) || !context.some((m) => m.organization_id === ownOrg
    && m.roles?.some((r) => r.code === 'CO' && r.branch_id === null && r.department_id === null
      && r.permissions?.includes('tenant.assets.manage')))
    || context.some((m) => m.organization_id === otherOrg && m.roles?.some((r) =>
      r.permissions?.includes('tenant.assets.read') || r.permissions?.includes('tenant.assets.manage')))) {
    throw new Error('بيانات شركتي الاختبار أو صلاحياتهما غير جاهزة لهذا الفحص.');
  }
  const bucket = client.storage.from('tenant-private');
  async function verifyIdentity() {
    const current = await client.auth.getUser();
    if (current.error || current.data?.user?.id !== userId) throw new Error('تغيرت الجلسة؛ أعد الفحص بالحساب الصحيح.');
  }
  await verifyIdentity();
  const results = [];
  function check(label, passed) {
    const row = { label, passed: Boolean(passed) }; results.push(row); onResult(row);
    if (!passed) throw new Error(`توقف فحص الملفات: ${label}`);
  }
  const ownPath = paths[ownOrg];
  if (action === 'prepare') {
    const { error } = await bucket.upload(ownPath, new Blob([ASSET_MARKER], { type: 'text/plain' }), { upsert: false, cacheControl: '0' });
    check('رفع ملف الاختبار الخاص بشركتك دون استبدال ملف قائم', !error);
  }
  const missing = (response) => !response.data && [400, 404].includes(Number(response.error?.statusCode))
    && ['Object not found', 'The resource was not found'].includes(response.error?.message);
  async function confirmAbsent(response) {
    const listed = await bucket.list(ownPath.slice(0, ownPath.lastIndexOf('/')), { search: 'probe.txt', limit: 100 });
    check('التحقق من زوال ملف الاختبار بالتنزيل وقائمة الملفات', missing(response)
      && !listed.error && Array.isArray(listed.data) && !listed.data.some((entry) => entry.name === 'probe.txt'));
  }
  const own = await bucket.download(ownPath);
  if (action === 'cleanup' && missing(own)) {
    await confirmAbsent(own);
    await verifyIdentity();
    return { action, organizationId: ownOrg, results };
  }
  check('قراءة بايتات ملف شركتك والتحقق من علامة الاختبار', !own.error && own.data && await own.data.text() === ASSET_MARKER);
  if (action === 'cleanup') {
    const removed = await bucket.remove([ownPath]);
    check('حذف ملف الاختبار المحدد فقط', !removed.error && removed.data?.some((r) => r.name === ownPath));
    const gone = await bucket.download(ownPath);
    await confirmAbsent(gone);
    await verifyIdentity();
    return { action, organizationId: ownOrg, results };
  }
  const signed = await bucket.createSignedUrl(ownPath, 30);
  check('إنشاء رابط مؤقت لملف شركتك', !signed.error && typeof signed.data?.signedUrl === 'string');
  const url = new URL(signed.data.signedUrl);
  check('مطابقة وجهة الرابط مع ملف اختبار كفو', url.origin === KFO_URL
    && decodeURIComponent(url.pathname) === `/storage/v1/object/sign/tenant-private/${ownPath}`);
  const bytes = await fetchImpl(url.href, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000) });
  check('قراءة الملف عبر الرابط المؤقت', bytes.status === 200 && await bytes.text() === ASSET_MARKER);
  if (action === 'prepare') {
    await verifyIdentity();
    return { action, organizationId: ownOrg, results };
  }
  // Verify BOTH prepare reports independently before counting these denials as isolation evidence.
  const denied = (error) => error && [400,403,404].includes(Number(error.statusCode))
    && ['Object not found', 'new row violates row-level security policy', 'Unauthorized'].includes(error.message);
  const foreign = await bucket.download(paths[otherOrg]);
  check('منع قراءة ملف الشركة الأخرى', !foreign.data && denied(foreign.error));
  const foreignSigned = await bucket.createSignedUrl(paths[otherOrg], 30);
  check('منع إنشاء رابط مؤقت لملف الشركة الأخرى', !foreignSigned.data?.signedUrl && denied(foreignSigned.error));
  // Unique reserved probe path avoids overwriting even if authorization unexpectedly allows insertion.
  const probePath = `${otherOrg}/qa-g1-20261001/denied-${crypto.randomUUID()}.txt`;
  const write = await bucket.upload(probePath, new Blob([ASSET_MARKER], { type: 'text/plain' }), { upsert: false, cacheControl: '0' });
  if (!write.error) {
    // Report only this known test object for cleanup by the other company's owner.
    onResult({ label: `يلزم تنظيف ملف اختبار غير متوقع: ${probePath}`, passed: false });
  }
  check('منع الكتابة في الشركة الأخرى', denied(write.error));
  await verifyIdentity();
  return { action, organizationId: ownOrg, results, requiresBothPrepareEvidence: true };
}
