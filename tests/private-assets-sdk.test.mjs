import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageClient } from '@supabase/storage-js';
import { runPrivateAssetChecks, ASSET_MARKER, ASSET_ORG_B } from '../qa/private-assets-checks.mjs';
import { QA_ORG, KFO_URL, FIXTURES } from '../qa/invitation-checks.mjs';

// Exercise the locked SDK's actual download/API error classes, not hand-written errors.
function sdkFixture({ role = 'CO', denial = { status: 400, body: { statusCode: '404', message: 'Object not found' } }, foreignBytes = false } = {}) {
  const userId = Object.keys(FIXTURES).find((id) => FIXTURES[id].role === role);
  const ownOrg = role === 'CO' ? QA_ORG : ASSET_ORG_B;
  const ownPath = `${ownOrg}/qa-g1-20261001/probe.txt`;
  const calls = [];
  const storage = new StorageClient(`${KFO_URL}/storage/v1`, {}, async (input, init) => {
    const path = new URL(input).pathname;
    calls.push([init.method, path]);
    if (path === `/storage/v1/object/tenant-private/${ownPath}` && init.method === 'GET') return new Response(ASSET_MARKER);
    if (path === `/storage/v1/object/sign/tenant-private/${ownPath}`) return Response.json({ signedURL: `/object/sign/tenant-private/${ownPath}?token=PRIVATE-TEST-URL` });
    if (foreignBytes && init.method === 'GET') return new Response(ASSET_MARKER);
    if (denial instanceof Error) throw denial;
    return new Response(typeof denial.body === 'string' ? denial.body : JSON.stringify(denial.body), { status: denial.status, headers: { 'content-type': 'application/json' } });
  });
  return { calls, client: {
    storage,
    auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    rpc: async () => ({ data: [{ organization_id: ownOrg, roles: [{ code: 'CO', branch_id: null, department_id: null, permissions: ['tenant.assets.manage'] }] }] }),
  }, fetchImpl: async () => new Response(ASSET_MARKER) };
}

test('locked Storage SDK download denials and API denials pass for both QA owners', async () => {
  for (const role of ['CO', 'EM']) {
    for (const denial of [{ status: 400, body: { statusCode: '404', message: 'Object not found', token: 'PRIVATE-TEST-RESPONSE' } },
      { status: 403, body: { statusCode: '403', message: 'new row violates row-level security policy' } }]) {
      const report = await runPrivateAssetChecks(sdkFixture({ role, denial }));
      assert.equal(report.results.length, 7);
      assert.equal(report.results.every((row) => row.passed), true);
      assert.deepEqual(report.results.slice(4).map((row) => row.status), [denial.status, denial.status, denial.status]);
      assert.equal(JSON.stringify(report).includes('PRIVATE-TEST'), false);
    }
  }
});

test('SDK network errors, malformed bodies, unexpected HTTP and unrelated denials stop before writing', async () => {
  for (const denial of [new TypeError('network unavailable'), { status: 500, body: { statusCode: '404', message: 'Object not found' } },
    { status: 400, body: 'invalid json' }, { status: 403, body: { message: 'Invalid signature' } },
    { status: 400, body: { statusCode: '500', message: 'Object not found' } }]) {
    const f = sdkFixture({ denial });
    await assert.rejects(runPrivateAssetChecks(f), /منع قراءة ملف الشركة الأخرى/);
    assert.equal(f.calls.some(([method, path]) => method === 'POST' && !path.includes('/sign/')), false);
  }
});

test('SDK foreign byte success stops before signing or writing', async () => {
  const f = sdkFixture({ foreignBytes: true });
  await assert.rejects(runPrivateAssetChecks(f), /منع قراءة ملف الشركة الأخرى/);
  assert.equal(f.calls.filter(([method]) => method === 'POST').length, 1);
});
