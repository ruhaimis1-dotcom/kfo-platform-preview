import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTenantContext, TenantAccessDenied } from '../src/tenant-context.ts';

const active = { membershipId: 'm1', userId: 'u1', organizationId: 'o1', status: 'active', branchId: 'b1', departmentId: null };

test('activates context from a current active membership, preserving scope', async () => {
  const result = await activateTenantContext('u1', 'o1', async () => active);
  assert.deepEqual(result, { userId: 'u1', organizationId: 'o1', membershipId: 'm1', branchId: 'b1', departmentId: null });
});

test('fails closed for missing identity, cross-tenant membership, wrong user, or inactive membership', async () => {
  const cases = [
    [null, 'o1', async () => active],
    ['u1', 'o2', async () => active],
    ['u2', 'o1', async () => active],
    ['u1', 'o1', async () => ({ ...active, status: 'suspended' })],
    ['u1', 'o1', async () => null],
  ];
  for (const args of cases) await assert.rejects(() => activateTenantContext(...args), TenantAccessDenied);
});
