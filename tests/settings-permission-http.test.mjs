import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { runSettingsPermissionChecks } from '../qa/settings-permission-checks.mjs';
import { FIXTURES, QA_ORG } from '../qa/invitation-checks.mjs';

function setup(role = 'EM', changes = {}) {
  const userId = Object.keys(FIXTURES).find((id) => FIXTURES[id].role === role);
  const membership = FIXTURES[userId].membership;
  const branch = role === 'BM' ? '27a084c1-004c-4a41-bcc1-5c3d08e78805' : null;
  const context = [{ membership_id: membership, organization_id: QA_ORG, branch_id: branch,
    department_id: null, roles: [{ code: role, branch_id: branch, department_id: null, permissions: [] }] }];
  const own = [{ id: membership, user_id: userId, organization_id: QA_ORG, branch_id: branch, status: 'active' }];
  const replies = [[200, { id: userId }], [200, context], [200, own], [200, { id: userId }], [403, { code: '42501' }]];
  const calls = [];
  const rows = [];
  return { calls, rows, context, own, options: { userId, accessToken: 'secret-test-token', onResult: (row) => rows.push(row),
    async fetchImpl(url, config) {
      const index = calls.length;
      calls.push({ url, config });
      assert.equal(config.cache, 'no-store');
      assert.equal(config.credentials, 'omit');
      assert.equal(config.headers.Authorization, 'Bearer secret-test-token');
      if (url.endsWith('/update_company_display_name')) {
        assert.equal(config.method, 'POST');
        assert.deepEqual(JSON.parse(config.body), { p_organization_id: QA_ORG, p_display_name: null });
      }
      const reply = changes[index] || replies[index];
      if (reply instanceof Error) throw reply;
      const [status, data] = reply;
      return { status, json: async () => data };
    } } };
}

test('BM and EM prove real settings permission denial with a non-writing null name', async () => {
  for (const role of ['BM', 'EM']) {
    const setupResult = setup(role);
    const report = await runSettingsPermissionChecks(setupResult.options);
    assert.equal(report.results.length, 5);
    assert.equal(setupResult.calls.length, 5);
    assert.equal(report.results.every((row) => row.passed), true);
    assert.equal(JSON.stringify(report).includes('secret-test-token'), false);
    assert.deepEqual(Object.keys(report.results[0]).sort(), ['label', 'passed', 'status']);
  }
});
test('unknown accounts, CO, and missing sessions cannot issue any requests', async () => {
  for (const userId of ['unknown', '__proto__', Object.keys(FIXTURES).find((id) => FIXTURES[id].role === 'CO')]) {
    await assert.rejects(runSettingsPermissionChecks({ userId, accessToken: 'x', fetchImpl() { assert.fail(); } }));
  }
  await assert.rejects(runSettingsPermissionChecks({ ...setup().options, accessToken: '', fetchImpl() { assert.fail(); } }));
});
test('wrong authenticated identity or identity change prevents the settings request', async () => {
  for (const index of [0, 3]) {
    const scenario = setup('EM', { [index]: [200, { id: 'other-user' }] });
    await assert.rejects(runSettingsPermissionChecks(scenario.options));
    assert.equal(scenario.calls.some((call) => call.url.endsWith('/update_company_display_name')), false);
  }
});
test('wrong role, broadened permission, missing scope and duplicate contexts stop before settings', async () => {
  for (const mutate of [
    (rows) => { rows[0].roles[0].code = 'CO'; },
    (rows) => { rows[0].roles[0].permissions.push('organization.settings.manage'); },
    (rows) => { rows[0].roles[0].branch_id = 'another-branch'; },
    (rows) => { delete rows[0].branch_id; },
    (rows) => { rows[0].organization_id = 'another-org'; },
    (rows) => { rows.push(structuredClone(rows[0])); },
  ]) {
    const scenario = setup(); mutate(scenario.context);
    await assert.rejects(runSettingsPermissionChecks(scenario.options));
    assert.equal(scenario.calls.length, 2);
  }
});
test('another user or inactive membership cannot reach settings RPC', async () => {
  for (const mutate of [(rows) => { rows[0].user_id = 'other'; }, (rows) => { rows[0].status = 'inactive'; },
    (rows) => { rows[0].branch_id = 'another-branch'; }, (rows) => { rows.splice(0); }]) {
    const scenario = setup('BM'); mutate(scenario.own);
    await assert.rejects(runSettingsPermissionChecks(scenario.options));
    assert.equal(scenario.calls.length, 3);
  }
});
test('validation rejection is an authorization regression and never a passing denial', async () => {
  const scenario = setup('EM', { 4: [400, { code: '22023' }] });
  await assert.rejects(runSettingsPermissionChecks(scenario.options));
  assert.equal(scenario.rows.at(-1).passed, false);
});
test('arbitrary status, arbitrary error codes, empty errors and success fail the denial gate', async () => {
  for (const reply of [[500, { code: '42501' }], [400, { code: '42501' }], [403, { code: 'other' }],
    [401, null], [200, { code: '42501' }], [200, null]]) {
    const scenario = setup('BM', { 4: reply });
    await assert.rejects(runSettingsPermissionChecks(scenario.options));
    assert.equal(scenario.rows.at(-1).passed, false);
  }
  const scenario = setup('EM', { 4: [401, { code: '42501' }] });
  assert.equal((await runSettingsPermissionChecks(scenario.options)).results.at(-1).passed, true);
});
test('network failures never fabricate a denial or retry', async () => {
  const scenario = setup('EM', { 4: new TypeError('network failed') });
  await assert.rejects(runSettingsPermissionChecks(scenario.options));
  assert.equal(scenario.calls.length, 5);
  assert.equal(scenario.rows.length, 4);
});
test('reviewed RPC checks authorization, rejects null names, and only then updates', async () => {
  const sql = await fs.readFile(new URL('../supabase/migrations/20260929081005_update_company_display_name.sql', import.meta.url), 'utf8');
  assert.match(sql, /v_name text := btrim\(p_display_name\)/);
  const authorization = sql.indexOf("errcode = '42501'");
  const validation = sql.indexOf('if v_name is null');
  const update = sql.indexOf('update public.organizations');
  assert.ok(authorization > 0 && authorization < validation && validation < update);
  assert.ok(sql.indexOf("errcode = '22023'", validation) < update);
});
