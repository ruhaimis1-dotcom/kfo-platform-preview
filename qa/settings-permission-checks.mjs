import { KFO_URL, KFO_KEY, QA_ORG, FIXTURES } from './invitation-checks.mjs';

// Authorization precedes name validation in the reviewed SQL migration.
// A null name can never reach UPDATE, including if authorization regresses.
export async function runSettingsPermissionChecks({ userId, accessToken, fetchImpl = fetch, onResult = () => {} }) {
  const fixture = Object.hasOwn(FIXTURES, userId) && FIXTURES[userId];
  if (!fixture || !['BM', 'EM'].includes(fixture.role) || !accessToken) {
    throw new Error('هذا الفحص مخصص لحساب الموظف أو مدير الفرع المعتمد فقط.');
  }
  const results = [];
  async function request(path, body) {
    const response = await fetchImpl(`${KFO_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { apikey: KFO_KEY, Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20000),
    });
    let data; try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  }
  function check(label, response, passed) {
    const row = { label, status: response.status, passed: Boolean(passed) };
    results.push(row); onResult(row);
    if (!passed) throw new Error(`توقف فحص منع حفظ الإعدادات: ${label}`);
  }
  const auth = await request('/auth/v1/user');
  check('التحقق من هوية الموظف أو مدير الفرع', auth, auth.status === 200 && auth.data?.id === userId);
  const context = await request('/rest/v1/rpc/my_access_context', {});
  const own = Array.isArray(context.data) && context.data.filter((row) => row.membership_id === fixture.membership);
  const role = own?.length === 1 && own[0].roles?.length === 1 && own[0].roles[0];
  const branch = fixture.role === 'BM' ? '27a084c1-004c-4a41-bcc1-5c3d08e78805' : null;
  check('مطابقة الدور وحدود الإعدادات من الخادم', context, context.status === 200
    && own?.length === 1 && own[0].organization_id === QA_ORG
    && own[0].branch_id === branch && own[0].department_id === null
    && role?.code === fixture.role && role.branch_id === branch && role.department_id === null
    && Array.isArray(role.permissions) && !role.permissions.includes('organization.settings.manage')
    && (fixture.role !== 'EM' || role.permissions.length === 0));
  const memberships = await request(`/rest/v1/organization_memberships?select=id,user_id,organization_id,status,branch_id&id=eq.${fixture.membership}&organization_id=eq.${QA_ORG}`);
  const member = Array.isArray(memberships.data) && memberships.data.length === 1 && memberships.data[0];
  check('مطابقة العضوية النشطة مع هوية الجلسة', memberships, memberships.status === 200
    && member?.id === fixture.membership && member.user_id === userId
    && member.organization_id === QA_ORG && member.status === 'active' && member.branch_id === branch);
  const current = await request('/auth/v1/user');
  check('تأكيد الهوية قبل طلب الإعدادات', current, current.status === 200 && current.data?.id === userId);
  const denied = await request('/rest/v1/rpc/update_company_display_name', {
    p_organization_id: QA_ORG, p_display_name: null,
  });
  check('رفض حفظ إعدادات الشركة من الخادم دون تغيير الاسم', denied,
    [401, 403].includes(denied.status) && denied.data?.code === '42501');
  return { results };
}
