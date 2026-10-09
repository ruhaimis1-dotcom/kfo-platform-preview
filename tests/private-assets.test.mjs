import test from 'node:test';
import assert from 'node:assert/strict';
import { runPrivateAssetChecks, ASSET_MARKER, ASSET_ORG_B } from '../qa/private-assets-checks.mjs';
import { QA_ORG, KFO_URL, FIXTURES } from '../qa/invitation-checks.mjs';
const owner = Object.keys(FIXTURES).find((id) => FIXTURES[id].role === 'CO');
const employee = Object.keys(FIXTURES).find((id) => FIXTURES[id].role === 'EM');
const denied = { statusCode: '404', message: 'Object not found' };
function fixture({ userId = owner, missingContext = false, wrongBytes = false, signedOrigin = KFO_URL,
  foreignSuccess = false, wrongDenial = false, cleanupError = false, missingStatus = 404, alreadyRemoved = false, listError = false, stillListed = false } = {}) {
  const ownOrg = userId === employee ? ASSET_ORG_B : QA_ORG;
  const ownPath = `${ownOrg}/qa-g1-20261001/probe.txt`;
  const calls = [];
  let removed = alreadyRemoved;
  const bucket = {
    async upload(path, bytes, options) {
      calls.push(['upload', path]); assert.equal(options.upsert, false);
      assert.equal(await bytes.text(), ASSET_MARKER);
      return path === ownPath ? { error: null } : { error: { statusCode: '403', message: 'new row violates row-level security policy' } };
    },
    async download(path) {
      calls.push(['download', path]);
      if (removed) return { error: cleanupError ? new Error('network error') : { ...denied, statusCode: String(missingStatus) } };
      if (path === ownPath) return { data: new Blob([wrongBytes ? 'unrelated content' : ASSET_MARKER]) };
      return foreignSuccess ? { data: new Blob([ASSET_MARKER]) } : { error: wrongDenial ? { statusCode: 500, message: 'Object not found' } : denied };
    },
    async createSignedUrl(path, expiry) {
      calls.push(['sign', path]); assert.equal(expiry, 30);
      return path === ownPath ? { data: { signedUrl: `${signedOrigin}/storage/v1/object/sign/tenant-private/${ownPath}?token=test` } } : { error: denied };
    },
    async list(folder, options) { calls.push(['list', folder]); assert.equal(options.search, 'probe.txt'); return listError ? { error: new Error('network') } : { data: stillListed || !removed ? [{ name: 'probe.txt' }] : [] }; },
    async remove(paths) { calls.push(['remove', paths]); assert.deepEqual(paths, [ownPath]); removed = true; return { data: [{ name: ownPath }] }; },
  };
  return { calls, client: {
    auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    rpc: async () => ({ data: missingContext ? [] : [{ organization_id: ownOrg, roles: [{ code: 'CO', branch_id: null, department_id: null, permissions: ['tenant.assets.manage'] }] }] }),
    storage: { from(name) { assert.equal(name, 'tenant-private'); return bucket; } },
  }, fetchImpl: async (url) => { assert.ok(url.startsWith(KFO_URL)); return { status: 200, text: async () => ASSET_MARKER }; } };
}
test('private asset prepare uses only the fixed QA path and confirms bytes and signed download', async () => {
  const f = fixture();
  const r = await runPrivateAssetChecks({ ...f, action: 'prepare' });
  assert.equal(r.results.length, 5);
  assert.equal(f.calls.filter(([kind]) => kind === 'upload').length, 1);
  assert.equal(JSON.stringify(r).includes('token='), false);
});
test('private asset verification tests foreign read, signing and non-overwriting write', async () => {
  for (const userId of [owner, employee]) {
    const r = await runPrivateAssetChecks(fixture({ userId }));
    assert.equal(r.requiresBothPrepareEvidence, true);
    assert.equal(r.results.length, 7);
  }
});
test('unknown account and missing QA owner context stop before Storage', async () => {
  for (const config of [{ userId: 'unknown' }, { missingContext: true }]) {
    const f = fixture(config); await assert.rejects(runPrivateAssetChecks(f)); assert.deepEqual(f.calls, []);
  }
});
test('a changed identity after context lookup stops before file access', async () => {
  const f = fixture(); let calls = 0;
  f.client.auth.getUser = async () => ({ data: { user: { id: calls++ ? employee : owner } } });
  await assert.rejects(runPrivateAssetChecks(f));
  assert.deepEqual(f.calls, []);
});
test('unrelated existing contents, external signed URLs and arbitrary errors cannot pass', async () => {
  for (const config of [{ wrongBytes: true }, { signedOrigin: 'https://other.example' }, { wrongDenial: true }]) {
    await assert.rejects(runPrivateAssetChecks(fixture(config)));
  }
});
test('unexpected foreign read success stops before a write probe', async () => {
  const f = fixture({ foreignSuccess: true }); await assert.rejects(runPrivateAssetChecks(f));
  assert.equal(f.calls.some(([kind]) => kind === 'upload'), false);
});
test('cleanup verifies the marker first, removes only the fixed object and requires actual not-found', async () => {
  const f = fixture(); assert.equal((await runPrivateAssetChecks({ ...f, action: 'cleanup' })).results.length, 5);
  // A download network failure cannot prove absence alone; the owner list must independently succeed.
  await assert.rejects(runPrivateAssetChecks({ ...fixture({ cleanupError: true, listError: true }), action: 'cleanup' }));
});

test('cleanup requires a successful independent exact-name absence listing', async () => {
  for (const missingStatus of [400, 404]) {
    const f = fixture({ missingStatus, alreadyRemoved: true });
    const r = await runPrivateAssetChecks({ ...f, action: 'cleanup' });
    assert.equal(r.results.length, 2);
    assert.equal(f.calls.some(([kind]) => kind === 'remove'), false);
  }
  for (const options of [{ listError: true }, { stillListed: true }]) {
    await assert.rejects(runPrivateAssetChecks({ ...fixture(options), action: 'cleanup' }));
  }
});
