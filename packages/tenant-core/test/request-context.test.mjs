import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantRequestContext, requireTenantMembership, TenantHostRejected } from '../src/request-context.ts';
import { TenantAccessDenied } from '../src/tenant-context.ts';

const organizations = new Map([
  ['acme.kfo.sa', { organizationId: 'org-acme', verified: true, domainType: 'kfo_subdomain' }],
  ['acme.example.com', { organizationId: 'org-acme', verified: true, domainType: 'custom' }],
  ['pending.example.com', { organizationId: 'org-pending', verified: false, domainType: 'custom' }],
]);
const memberships = new Map([
  ['user-1:org-acme', { membershipId: 'mem-1', userId: 'user-1', organizationId: 'org-acme', status: 'active', branchId: null, departmentId: null }],
  ['user-1:org-suspended', { membershipId: 'mem-2', userId: 'user-1', organizationId: 'org-suspended', status: 'suspended', branchId: null, departmentId: null }],
]);
const dependencies = {
  baseDomain: 'kfo.sa',
  lookupDomain: async (host) => organizations.get(host) ?? null,
  findMembership: async (userId, organizationId) => memberships.get(`${userId}:${organizationId}`) ?? null,
};

test('tenant host selects branding scope only; it does not grant membership', async () => {
  const context = await resolveTenantRequestContext({ trustedRequestHost: 'acme.kfo.sa', authenticatedUserId: null }, dependencies);
  assert.equal(context.kind, 'tenant-anonymous');
  assert.throws(() => requireTenantMembership(context), TenantAccessDenied);
});

test('verified identity with active membership receives tenant context', async () => {
  const context = await resolveTenantRequestContext({ trustedRequestHost: 'acme.kfo.sa', authenticatedUserId: 'user-1' }, dependencies);
  assert.equal(context.kind, 'tenant-member');
  assert.equal(requireTenantMembership(context).organizationId, 'org-acme');
});

test('a tenant host cannot be overridden with another organization selector', async () => {
  await assert.rejects(
    resolveTenantRequestContext({ trustedRequestHost: 'acme.kfo.sa', authenticatedUserId: 'user-1', requestedOrganizationId: 'org-other' }, dependencies),
    TenantAccessDenied,
  );
});

test('tenant member access is denied when membership is absent or suspended', async () => {
  await assert.rejects(
    resolveTenantRequestContext({ trustedRequestHost: 'acme.kfo.sa', authenticatedUserId: 'user-1', requestedOrganizationId: 'org-suspended' }, dependencies),
    TenantAccessDenied,
  );
  await assert.rejects(
    resolveTenantRequestContext({ trustedRequestHost: 'acme.kfo.sa', authenticatedUserId: 'user-2' }, dependencies),
    TenantAccessDenied,
  );
});

test('public host company-context switching validates membership and preserves public host', async () => {
  const context = await resolveTenantRequestContext({ trustedRequestHost: 'www.kfo.sa', authenticatedUserId: 'user-1', requestedOrganizationId: 'org-acme' }, dependencies);
  assert.equal(context.kind, 'tenant-member');
  assert.equal(context.host.kind, 'public');
  assert.equal(context.membership.organizationId, 'org-acme');
});

test('custom domain and unresolved/unverified host behavior', async () => {
  const custom = await resolveTenantRequestContext({ trustedRequestHost: 'acme.example.com', authenticatedUserId: 'user-1' }, dependencies);
  assert.equal(custom.kind, 'tenant-member');
  assert.equal(custom.host.kind, 'custom-domain');
  await assert.rejects(
    resolveTenantRequestContext({ trustedRequestHost: 'pending.example.com', authenticatedUserId: null }, dependencies),
    TenantHostRejected,
  );
});
