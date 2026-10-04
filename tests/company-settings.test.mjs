import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageSettings, saveCompanyName } from '../company/settings-data.mjs';
const allowed = { accessible: true, roles: [{ code: 'CO', permissions: ['organization.settings.manage'], branch_id: null, department_id: null }] };
test('settings navigation excludes disabled tenants and scoped managers', () => {
  assert.equal(canManageSettings(allowed), true);
  assert.equal(canManageSettings({ ...allowed, accessible: false }), false);
  assert.equal(canManageSettings({ ...allowed, roles: [{ ...allowed.roles[0], branch_id: 'branch' }] }), false);
  assert.equal(canManageSettings({ ...allowed, roles: [{ permissions: [] }] }), false);
});
test('invalid names never contact the server', async () => {
  for (const name of ['', 'x', 'a'.repeat(121), 'bad\nname']) {
    await assert.rejects(saveCompanyName({}, 'org', 'user', name), /invalid-name/);
  }
});
function fixture({ changedIdentity = false, forbidden = false, stale = false } = {}) {
  let writes = 0, name = 'Original';
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: changedIdentity ? 'other' : 'user' } } }) },
    from(table) {
      return { select() { return this; },
        eq: async () => ({ data: [{ id: 'member', user_id: changedIdentity ? 'other' : 'user', organization_id: 'org', status: 'active' }] }),
        in: async () => ({ data: [{ id: 'org', display_name: name, tenant_access_enabled: true }] }),
      };
    },
    async rpc(method, args) {
      if (method === 'my_access_context') return { data: [{ membership_id: 'member', organization_id: 'org', roles: forbidden ? [] : allowed.roles }] };
      writes++; if (!stale) name = args.p_display_name;
      return { data: args.p_display_name };
    },
  };
  return { client, writes: () => writes };
}
test('changed identity and lost permission prevent writes', async () => {
  for (const options of [{ changedIdentity: true }, { forbidden: true }]) {
    const f = fixture(options);
    await assert.rejects(saveCompanyName(f.client, 'org', 'user', 'Updated'));
    assert.equal(f.writes(), 0);
  }
});
test('save succeeds only after reading the persisted name', async () => {
  const f = fixture();
  assert.equal((await saveCompanyName(f.client, 'org', 'user', ' Updated ')).membership.name, 'Updated');
  assert.equal(f.writes(), 1);
  const stale = fixture({ stale: true });
  await assert.rejects(saveCompanyName(stale.client, 'org', 'user', 'Updated'), /verification-failed/);
  assert.equal(stale.writes(), 1);
});
