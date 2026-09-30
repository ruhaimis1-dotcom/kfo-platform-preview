// Preview-only HTTP gate. Fixed fixtures prevent this runner targeting customer data.
export const KFO_URL = 'https://ktkdcfxeaicbykdurlfg.supabase.co';
export const KFO_KEY = 'sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF';
export const QA_ORG = 'aa7a54d0-9bce-455d-adb4-971c21d9fdf1';
const QA_BRANCH = '27a084c1-004c-4a41-bcc1-5c3d08e78805';
const QA_NAME = 'كفو — شركة اختبار B1';
export const FIXTURES = Object.freeze({
  'be30f8b2-ea2b-4fd9-948f-ba665cb66b4d': { role: 'CO', label: 'مالك الشركة', membership: 'fed23e07-f419-47cc-b0f2-d6d3412e64fc' },
  '3185a595-18ce-4b7c-a06a-69d05eee5325': { role: 'BM', label: 'مدير الفرع', membership: '982a3882-2f91-4786-b724-80a9aec3ef86' },
  '45d418a3-a986-4a14-9629-651bee191cfb': { role: 'EM', label: 'الموظف', membership: '50719647-b170-4a62-9d65-3eadb0ad61ef' },
});

export async function runInvitationChecks({ userId, accessToken, fetchImpl = fetch, onResult = () => {} }) {
  const fixture = Object.hasOwn(FIXTURES, userId) ? FIXTURES[userId] : null;
  if (!fixture || !accessToken) throw new Error('يلزم تسجيل الدخول بأحد حسابات الاختبار الثلاثة.');
  const results = [];
  async function request(path, body, anonymous = false) {
    const response = await fetchImpl(`${KFO_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        apikey: KFO_KEY,
        ...(anonymous ? {} : { Authorization: `Bearer ${accessToken}` }),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
      credentials: 'omit',
    });
    let data;
    try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  }
  function check(id, label, result, valid) {
    const row = { id, label, status: result.status, passed: Boolean(valid) };
    results.push(row);
    onResult(row);
    if (!valid) throw new Error(`توقف الفحص عند: ${label}. لا يُعد هذا الاختبار ناجحًا.`);
  }
  const denied = (r) => [401, 403].includes(r.status) && r.data?.code === '42501';
  const auth = await request('/auth/v1/user');
  check('identity', 'التحقق من الجلسة لدى كفو', auth, auth.status === 200 && auth.data?.id === userId);
  const ownPath = `/rest/v1/organization_memberships?select=id,user_id,organization_id,status,branch_id&id=eq.${fixture.membership}&organization_id=eq.${QA_ORG}`;
  const before = await request(ownPath);
  const membership = before.data?.[0];
  check('fixture', 'التحقق من عضويتك في شركة الاختبار', before,
    before.status === 200 && Array.isArray(before.data) && before.data.length === 1
    && membership.id === fixture.membership && membership.user_id === userId
    && membership.organization_id === QA_ORG && ['invited', 'active'].includes(membership.status));
  const anonymous = await request('/rest/v1/rpc/accept_invitation', { p_membership_id: fixture.membership }, true);
  check('anonymous', 'منع قبول الدعوة دون تسجيل دخول', anonymous, denied(anonymous));
  const other = Object.values(FIXTURES).find((item) => item.membership !== fixture.membership);
  const crossUser = await request('/rest/v1/rpc/accept_invitation', { p_membership_id: other.membership });
  check('cross-user', 'منع قبول عضوية مستخدم آخر', crossUser, denied(crossUser));
  const accepted = await request('/rest/v1/rpc/accept_invitation', { p_membership_id: fixture.membership });
  check(membership.status === 'invited' ? 'accept' : 'active-retry',
    membership.status === 'invited' ? 'قبول دعوتك' : 'إعادة طلب عضويتك النشطة', accepted,
    accepted.status === 200 && accepted.data === fixture.membership);
  const retry = await request('/rest/v1/rpc/accept_invitation', { p_membership_id: fixture.membership });
  check('retry', 'إعادة الطلب بصورة آمنة', retry, retry.status === 200 && retry.data === fixture.membership);
  const after = await request(ownPath);
  check('persisted', 'قراءة عضويتك النشطة بعد الطلب', after,
    after.status === 200 && Array.isArray(after.data) && after.data.length === 1
    && after.data[0].id === fixture.membership && after.data[0].user_id === userId
    && after.data[0].organization_id === QA_ORG && after.data[0].status === 'active');
  const members = await request(`/rest/v1/organization_memberships?select=id,user_id,organization_id,branch_id&organization_id=eq.${QA_ORG}`);
  check('scope', 'حدود قراءة العضويات بحسب الدور', members,
    members.status === 200 && Array.isArray(members.data)
    && members.data.some((m) => m.id === fixture.membership)
    && members.data.every((m) => m.organization_id === QA_ORG
      && (fixture.role === 'CO' || (fixture.role === 'EM' ? m.user_id === userId : m.user_id === userId || m.branch_id === QA_BRANCH))));
  if (fixture.role === 'CO') {
    const organization = await request(`/rest/v1/organizations?select=id,display_name&id=eq.${QA_ORG}`);
    check('fixture-name', 'التحقق من اسم شركة الاختبار قبل الطلب', organization,
      organization.status === 200 && Array.isArray(organization.data) && organization.data.length === 1
      && organization.data[0].id === QA_ORG && organization.data[0].display_name === QA_NAME);
  }
  const settings = await request('/rest/v1/rpc/update_company_display_name', {
    p_organization_id: QA_ORG, p_display_name: QA_NAME,
  });
  check('settings', fixture.role === 'CO' ? 'صلاحية المالك لطلب الاسم الحالي' : 'منع تعديل إعدادات الشركة', settings,
    fixture.role === 'CO' ? settings.status === 200 && settings.data === QA_NAME : denied(settings));
  return { role: fixture.role, initialStatus: membership.status, results };
}

export async function runAnonymousCheck(fetchImpl = fetch) {
  const response = await fetchImpl(`${KFO_URL}/rest/v1/rpc/accept_invitation`, {
    method: 'POST', headers: { apikey: KFO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_membership_id: '00000000-0000-0000-0000-000000000000' }),
    signal: AbortSignal.timeout(20000), credentials: 'omit', cache: 'no-store',
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status, passed: [401, 403].includes(response.status) && data?.code === '42501' };
}
