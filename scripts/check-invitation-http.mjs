// Live KFO invitation RPC check. Tokens are read from the environment only.
// Use disposable test invitations; a successful call activates membership.
const endpoint = process.env.KFO_HTTP_URL;
const key = process.env.KFO_PUBLISHABLE_KEY;
const ownId = process.env.KFO_TEST_OWN_MEMBERSHIP_ID;
const otherId = process.env.KFO_TEST_OTHER_MEMBERSHIP_ID;
const token = process.env.KFO_TEST_ACCESS_TOKEN;

if (!endpoint || !key) {
  throw new Error('KFO_HTTP_URL and KFO_PUBLISHABLE_KEY are required');
}
const url = new URL('/rest/v1/rpc/accept_invitation', endpoint);
if (url.hostname !== 'ktkdcfxeaicbykdurlfg.supabase.co') {
  throw new Error('Refusing a project other than KFO');
}

async function call(membershipId, accessToken) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ p_membership_id: membershipId }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json();
  return { status: response.status, body };
}

const absent = '00000000-0000-0000-0000-000000000000';
const anonymous = await call(absent);
if (![401, 403].includes(anonymous.status) || anonymous.body.code !== '42501') {
  throw new Error(`Anonymous RPC denial failed (HTTP ${anonymous.status})`);
}
console.log('anonymous RPC denied');

if (!token && !ownId && !otherId) {
  console.log('authenticated checks pending: provide a disposable session and two invitation IDs');
  process.exit(0);
}
if (!token || !ownId || !otherId || ownId === otherId) {
  throw new Error('Provide KFO_TEST_ACCESS_TOKEN and distinct own/other membership IDs together');
}
for (const [label, id] of [['own invitation', ownId], ['authorized retry', ownId]]) {
  const result = await call(id, token);
  if (result.status !== 200 || result.body !== id) {
    throw new Error(`${label} failed (HTTP ${result.status})`);
  }
  console.log(`${label} accepted`);
}
const other = await call(otherId, token);
if (![401, 403].includes(other.status) || other.body.code !== '42501') {
  throw new Error(`Cross-user denial failed (HTTP ${other.status})`);
}
console.log('cross-user RPC denied');
