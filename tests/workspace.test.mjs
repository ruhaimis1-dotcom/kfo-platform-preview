import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorkspace } from '../auth/workspace-data.mjs';
function client({ user = { id: 'u1', email: 'person@example.com' }, members = [], orgs = [], memberError = null } = {}) {
  const calls = [];
  return { calls, auth: { getUser: async () => ({ data: { user }, error: null }) }, from(table) {
    calls.push(table);
    return { select() { return this; },
      async eq(column, value) { assert.equal(column, 'user_id'); assert.equal(value, 'u1'); return { data: members, error: memberError }; },
      async in(column, ids) { assert.equal(column, 'id'); assert.deepEqual(ids, ['o1']); return { data: orgs, error: null }; },
    };
  } };
}
const active = { id: 'm1', user_id: 'u1', organization_id: 'o1', status: 'active' };
test('workspace does not query memberships without a verified Auth user', async () => {
  const c = client({ user: null });
  assert.deepEqual(await loadWorkspace(c), { kind: 'signed-out' });
  assert.equal(c.calls.length, 0);
});
test('workspace reflects an accepted membership and accessible real organization', async () => {
  const c = client({ members: [active], orgs: [{ id: 'o1', display_name: 'Actual company', tenant_access_enabled: true }] });
  const result = await loadWorkspace(c);
  assert.equal(result.memberships[0].accessible, true);
  assert.equal(result.memberships[0].name, 'Actual company');
});
test('invited membership cannot read company details or appear active', async () => {
  const c = client({ members: [{ ...active, status: 'invited' }] });
  const result = await loadWorkspace(c);
  assert.equal(result.memberships[0].accessible, false);
  assert.deepEqual(c.calls, ['organization_memberships']);
});
test('workspace rejects another user row even if a data boundary leaks it', async () => {
  const c = client({ members: [{ ...active, user_id: 'u2' }] });
  await assert.rejects(loadWorkspace(c));
  assert.deepEqual(c.calls, ['organization_memberships']);
});
test('missing or disabled organization fails closed despite active membership', async () => {
  for (const orgs of [[], [{ id: 'o1', display_name: 'Disabled', tenant_access_enabled: false }]]) {
    const result = await loadWorkspace(client({ members: [active], orgs }));
    assert.equal(result.memberships[0].accessible, false);
  }
});
test('membership API failure is not misrepresented as an empty account', async () => {
  await assert.rejects(loadWorkspace(client({ memberError: new Error('denied') })));
});
