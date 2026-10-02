import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAccessContext, attachAccessContext } from '../auth/access-context.mjs';
const memberships = [
  { membership_id: 'm1', organization_id: 'o1', roles: [{ code: 'CO', branch_id: null, department_id: null, permissions: ['organization.settings.manage'] }] },
  { membership_id: 'm2', organization_id: 'o2', roles: [{ code: 'BM', branch_id: 'b2', department_id: 'd2', permissions: ['members.read'] }] },
];
function client({ user = { id: 'u1', user_metadata: { role: 'SA' } }, data = memberships, error = null, changed = false } = {}) {
  let reads = 0;
  return { calls: [], auth: { async getUser() { reads++; return { data: { user: changed && reads > 1 ? { id: 'u2' } : user }, error: null }; } },
    async rpc(...args) { this.calls.push(args); return { data, error }; } };
}
test('role context requires a verified user and never submits identity parameters', async () => {
  const out = client({ user: null });
  assert.deepEqual(await loadAccessContext(out), { kind: 'signed-out' });
  assert.deepEqual(out.calls, []);
  const c = client();
  const result = await loadAccessContext(c);
  assert.deepEqual(c.calls, [['my_access_context']]);
  assert.equal(result.memberships[0].roles[0].code, 'CO');
});
test('roles and permissions retain separate company/branch/department scopes', async () => {
  assert.deepEqual((await loadAccessContext(client())).memberships, memberships);
});
test('empty active context does not fabricate a role from user metadata', async () => {
  assert.deepEqual(await loadAccessContext(client({ data: [] })), { kind: 'ready', userId: 'u1', memberships: [] });
});
test('API failure and malformed context fail closed', async () => {
  for (const config of [{ error: new Error('denied') }, { data: null }, { data: [memberships[0], memberships[0]] },
    { data: [{ ...memberships[0], roles: [{ code: 'CO', permissions: [42] }] }] }]) {
    await assert.rejects(loadAccessContext(client(config)));
  }
});
test('an identity change during the RPC discards the prior user context', async () => {
  await assert.rejects(loadAccessContext(client({ changed: true })));
});
test('workspace role attachment rejects changed identities, revoked and mismatched memberships', () => {
  const workspace = { userId: 'u1', memberships: [{ id: 'm1', organizationId: 'o1', accessible: true }] };
  const context = { kind: 'ready', userId: 'u1', memberships: [memberships[0]] };
  assert.equal(attachAccessContext(workspace, context)[0].roles[0].code, 'CO');
  assert.throws(() => attachAccessContext({ ...workspace, userId: 'u2' }, context));
  assert.throws(() => attachAccessContext({ ...workspace, memberships: [{ ...workspace.memberships[0], accessible: false }] }, context));
  assert.throws(() => attachAccessContext(workspace, { ...context, memberships: [memberships[1]] }));
  assert.deepEqual(attachAccessContext(workspace, { ...context, memberships: [] })[0].roles, []);
});
