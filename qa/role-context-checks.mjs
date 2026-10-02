import { KFO_URL, KFO_KEY, QA_ORG, FIXTURES } from './invitation-checks.mjs';
export async function runRoleContextChecks({ userId, accessToken, fetchImpl = fetch, onResult = () => {} }) {
  const fixture = Object.hasOwn(FIXTURES, userId) && FIXTURES[userId];
  if (!fixture || !accessToken) throw new Error('يلزم الدخول بحساب اختبار كفو.');
  const results = [];
  async function request(path, anonymous = false) {
    const response = await fetchImpl(`${KFO_URL}${path}`, {
      method: path.includes('/rpc/') ? 'POST' : 'GET',
      headers: { apikey: KFO_KEY, ...(anonymous ? {} : { Authorization: `Bearer ${accessToken}` }),
        ...(path.includes('/rpc/') ? { 'Content-Type': 'application/json' } : {}) },
      ...(path.includes('/rpc/') ? { body: '{}' } : {}),
      cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20000),
    });
    let data; try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  }
  function check(label, response, passed) {
    const row = { label, status: response.status, passed: Boolean(passed) };
    results.push(row); onResult(row);
    if (!passed) throw new Error(`توقف فحص الصلاحيات: ${label}`);
  }
  const identity = await request('/auth/v1/user');
  check('التحقق من هوية الجلسة', identity, identity.status === 200 && identity.data?.id === userId);
  const anon = await request('/rest/v1/rpc/my_access_context', true);
  check('منع قراءة الأدوار دون دخول', anon, [401,403].includes(anon.status) && anon.data?.code === '42501');
  const response = await request('/rest/v1/rpc/my_access_context');
  const own = Array.isArray(response.data) && response.data.find((m) => m.membership_id === fixture.membership);
  check('قراءة دور عضوية الاختبار من الخادم', response, response.status === 200 && own?.organization_id === QA_ORG
    && own.roles?.length === 1 && own.roles[0].code === fixture.role
    && own.roles[0].branch_id === (fixture.role === 'BM' ? '27a084c1-004c-4a41-bcc1-5c3d08e78805' : null)
    && own.roles[0].department_id === null && Array.isArray(own.roles[0].permissions));
  const permissions = own.roles[0].permissions;
  check('عدم توسيع صلاحيات الموظف', response, fixture.role !== 'EM' || permissions.length === 0);
  check('حدود صلاحية إعدادات الشركة', response, fixture.role === 'CO'
    ? permissions.includes('organization.settings.manage') : !permissions.includes('organization.settings.manage'));
  const rows = await request(`/rest/v1/organization_memberships?select=id,organization_id,status&user_id=eq.${userId}`);
  check('مطابقة كل سياق دور مع عضوية المستخدم نفسه', rows, rows.status === 200 && Array.isArray(rows.data)
    && response.data.every((m) => rows.data.some((r) => r.id === m.membership_id && r.organization_id === m.organization_id && r.status === 'active')));
  return { results };
}
