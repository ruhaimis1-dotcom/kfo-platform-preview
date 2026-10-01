import test from 'node:test';
import assert from 'node:assert/strict';
import { FIXTURES, QA_ORG, KFO_URL, runInvitationChecks, runAnonymousCheck } from '../qa/invitation-checks.mjs';

const userId = '45d418a3-a986-4a14-9629-651bee191cfb';
const own = FIXTURES[userId].membership;
const active = { id: own, user_id: userId, organization_id: QA_ORG, status: 'active', branch_id: null };
const denial = { status: 403, data: { code: '42501' } };
function transport(overrides = {}) {
  const calls = [];
  const rows = [
    { status: 200, data: { id: userId } },
    { status: 200, data: [{ ...active, status: 'invited' }] },
    denial, denial,
    { status: 200, data: own }, { status: 200, data: own },
    { status: 200, data: [active] }, { status: 200, data: [active] }, denial,
  ];
  const fetchImpl = async (url, options) => {
    const index = calls.length;
    calls.push({ url, options });
    const row = overrides[index] || rows[index];
    assert.ok(row, 'Unexpected extra request');
    return { status: row.status, json: async () => row.data };
  };
  return { calls, fetchImpl };
}
const args = { userId, accessToken: 'test-session-not-a-real-token' };

test('HTTP fixture runner rejects unknown accounts without a request', async () => {
  const tx = transport();
  await assert.rejects(runInvitationChecks({ ...args, userId: 'unknown', fetchImpl: tx.fetchImpl }));
  assert.equal(tx.calls.length, 0);
});
test('HTTP runner stops before mutation when server identity differs', async () => {
  const tx = transport({ 0: { status: 200, data: { id: 'another-user' } } });
  await assert.rejects(runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl }));
  assert.equal(tx.calls.length, 1);
});
test('HTTP runner rejects anonymous exposure before attempting authenticated acceptance', async () => {
  const tx = transport({ 2: { status: 200, data: own } });
  await assert.rejects(runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl }));
  assert.equal(tx.calls.length, 3);
});
test('HTTP runner validates acceptance, retry and persistence without reporting a token', async () => {
  const tx = transport();
  const report = await runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl });
  assert.equal(report.initialStatus, 'invited');
  assert.ok(report.results.every((r) => r.passed));
  assert.ok(report.results.some((r) => r.id === 'accept'));
  assert.ok(!JSON.stringify(report).includes(args.accessToken));
  assert.ok(tx.calls.every((c) => c.url.startsWith(KFO_URL + '/')));
  assert.equal(tx.calls[2].options.headers.Authorization, undefined);
  assert.equal(tx.calls[3].options.headers.Authorization, `Bearer ${args.accessToken}`);
});
test('active membership rerun does not claim first acceptance', async () => {
  const tx = transport({ 1: { status: 200, data: [active] } });
  const report = await runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl });
  assert.ok(!report.results.some((r) => r.id === 'accept'));
  assert.ok(report.results.some((r) => r.id === 'active-retry'));
});
test('HTTP runner detects another employee row leaked through RLS', async () => {
  const tx = transport({ 7: { status: 200, data: [active, { ...active, user_id: 'someone-else' }] } });
  await assert.rejects(runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl }));
  assert.equal(tx.calls.length, 8);
});
test('HTTP runner fails if employee settings unexpectedly succeed', async () => {
  const tx = transport({ 8: { status: 200, data: 'كفو — شركة اختبار B1' } });
  await assert.rejects(runInvitationChecks({ ...args, fetchImpl: tx.fetchImpl }));
});
test('anonymous check requires permission denial, not an arbitrary failed response', async () => {
  const result = await runAnonymousCheck(async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return { status: 401, json: async () => ({ code: 'PGRST301' }) };
  });
  assert.equal(result.passed, false);
});

test('branch manager cannot pass with rows from another branch', async () => {
  const id = '3185a595-18ce-4b7c-a06a-69d05eee5325';
  const membership = FIXTURES[id].membership;
  const row = { id: membership, user_id: id, organization_id: QA_ORG, status: 'active', branch_id: '27a084c1-004c-4a41-bcc1-5c3d08e78805' };
  const responses = [{ id }, [row], { code: '42501' }, { code: '42501' }, membership, membership, [row], [row, { ...row, user_id: userId, branch_id: 'other-branch' }]];
  let count = 0;
  const fetchImpl = async () => {
    const index = count++;
    return { status: [2, 3].includes(index) ? 403 : 200, json: async () => responses[index] };
  };
  await assert.rejects(runInvitationChecks({ ...args, userId: id, fetchImpl }));
  assert.equal(count, 8);
});
test('owner runner stops before settings RPC if test company was renamed', async () => {
  const id = 'be30f8b2-ea2b-4fd9-948f-ba665cb66b4d';
  const membership = FIXTURES[id].membership;
  const row = { id: membership, user_id: id, organization_id: QA_ORG, status: 'active', branch_id: null };
  const responses = [{ id }, [row], { code: '42501' }, { code: '42501' }, membership, membership, [row], [row], [{ id: QA_ORG, display_name: 'اسم آخر' }]];
  let count = 0;
  const fetchImpl = async () => {
    const index = count++;
    return { status: [2, 3].includes(index) ? 403 : 200, json: async () => responses[index] };
  };
  await assert.rejects(runInvitationChecks({ ...args, userId: id, fetchImpl }));
  assert.equal(count, 9);
});
