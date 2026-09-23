import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHostname, resolveTenantHost } from '../src/host-resolution.ts';

const lookup = async (host) => {
  if (host === 'acme.kfo.sa') return { organizationId: 'org-acme', verified: true, domainType: 'kfo_subdomain' };
  if (host === 'academy.example.com') return { organizationId: 'org-1', verified: true, domainType: 'custom' };
  if (host === 'pending.example.com') return { organizationId: 'org-2', verified: false, domainType: 'custom' };
  return null;
};

test('normalizes case, trailing dot, and numeric port', () => {
  assert.equal(normalizeHostname(' Acme.KFO.SA.:443 '), 'acme.kfo.sa');
});

test('rejects malformed or unsafe host input', () => {
  for (const host of ['', 'https://acme.kfo.sa', 'a..kfo.sa', 'acme.kfo.sa/path', 'acme.kfo.sa:99999', '[::1]']) {
    assert.equal(normalizeHostname(host), null, host);
  }
});

test('recognizes public host and one valid tenant subdomain', async () => {
  assert.deepEqual(await resolveTenantHost('www.kfo.sa', 'kfo.sa', lookup), { kind: 'public', hostname: 'www.kfo.sa' });
  assert.deepEqual(await resolveTenantHost('acme.kfo.sa:443', 'kfo.sa', lookup), { kind: 'tenant-subdomain', hostname: 'acme.kfo.sa', slug: 'acme', organizationId: 'org-acme' });
});

test('does not confuse suffix lookalikes, nested hosts, or reserved route labels with tenants', async () => {
  for (const host of ['acmekfo.sa', 'x.acme.kfo.sa', 'admin.kfo.sa', 'a.kfo.sa.evil.test']) {
    assert.equal((await resolveTenantHost(host, 'kfo.sa', lookup)).kind, 'unresolved', host);
  }
});

test('custom domains resolve only after verification', async () => {
  assert.deepEqual(await resolveTenantHost('academy.example.com', 'kfo.sa', lookup), { kind: 'custom-domain', hostname: 'academy.example.com', organizationId: 'org-1' });
  assert.equal((await resolveTenantHost('pending.example.com', 'kfo.sa', lookup)).reason, 'unverified-domain');
  assert.equal((await resolveTenantHost('unknown.example.com', 'kfo.sa', lookup)).reason, 'unknown-tenant');
  assert.equal((await resolveTenantHost('missing.kfo.sa', 'kfo.sa', lookup)).reason, 'unknown-tenant');
});
