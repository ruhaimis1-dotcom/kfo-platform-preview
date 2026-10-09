import test from 'node:test';
import assert from 'node:assert/strict';
import { runRoleContextChecks } from '../qa/role-context-checks.mjs';
import { FIXTURES, QA_ORG } from '../qa/invitation-checks.mjs';
const userId = Object.keys(FIXTURES).find((id) => FIXTURES[id].role === 'EM');
const membership = FIXTURES[userId].membership;
function options(change = {}) {
  let count = 0;
  const replies = [
    [200, { id: userId }], [401, { code: '42501' }],
    [200, [{ membership_id: membership, organization_id: QA_ORG, roles: [{ code: 'EM', branch_id: null, department_id: null, permissions: [] }] }]],
    [200, [{ id: membership, organization_id: QA_ORG, status: 'active' }]],
  ];
  return { userId, accessToken: 'test-only', async fetchImpl(url, config) {
    const index = count++;
    if (index === 1) assert.equal(config.headers.Authorization, undefined);
    if (url.includes('/rpc/')) assert.equal(config.body, '{}');
    const [status, data] = change[index] || replies[index];
    return { status, json: async () => data };
  } };
}
test('HTTP role gate checks Auth, anonymous denial, actual role scope and own active memberships', async () => {
  const report = await runRoleContextChecks(options());
  assert.equal(report.results.length, 6);
  assert.equal(JSON.stringify(report).includes('test-only'), false);
});
test('unknown accounts cannot issue role gate requests', async () => {
  await assert.rejects(runRoleContextChecks({ userId: 'other', accessToken: 'x', fetchImpl() { assert.fail(); } }));
});
test('a server identity mismatch or arbitrary failure cannot pass the gate', async () => {
  await assert.rejects(runRoleContextChecks(options({ 0: [200, { id: 'other' }] })));
  await assert.rejects(runRoleContextChecks(options({ 1: [500, { code: '42501' }] })));
});
test('incorrect role, widened employee permissions and another user context fail', async () => {
  for (const roles of [[{ code: 'CO', branch_id: null, department_id: null, permissions: [] }],
    [{ code: 'EM', branch_id: null, department_id: null, permissions: ['organization.settings.manage'] }]]) {
    await assert.rejects(runRoleContextChecks(options({ 2: [200, [{ membership_id: membership, organization_id: QA_ORG, roles }]] })));
  }
  await assert.rejects(runRoleContextChecks(options({ 3: [200, []] })));
});
