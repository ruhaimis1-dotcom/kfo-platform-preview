import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSupabaseTenantRequestContext, TenantLookupFailed } from '../src/supabase-request-adapter.ts';
import { TenantAccessDenied } from '../src/tenant-context.ts';

const row = {
  id: 'membership-1',
  user_id: 'user-1',
  organization_id: 'org-acme',
  status: 'active',
  branch_id: null,
  department_id: null,
};

function makeClient({ hostRows = [], membership = null, hostError = null, membershipError = null } = {}) {
  const calls = { rpc: [], membershipFilters: [] };
  return {
    calls,
    rpc: async (name, args) => {
      calls.rpc.push({ name, args });
      return { data: hostRows, error: hostError };
    },
    from: (table) => ({
      select: (columns) => {
        let userId;
        let organizationId;
        const query = {
          eq(column, value) {
            calls.membershipFilters.push({ column, value });
            if (column === 'user_id') userId = value;
            if (column === 'organization_id') organizationId = value;
            return query;
          },
          maybeSingle: async () => {
            assert.equal(table, 'organization_memberships');
            assert.equal(columns, 'id,user_id,organization_id,status,branch_id,department_id');
            if (membershipError) return { data: null, error: membershipError };
            if (membership?.user_id === userId && membership?.organization_id === organizationId) {
              return { data: membership, error: null };
            }
            return { data: null, error: null };
          },
        };
        return query;
      },
    }),
  };
}

test('uses public host RPC and user-scoped membership query for an authorized tenant', async () => {
  const publicClient = makeClient({ hostRows: [{ organization_id: 'org-acme', tenant_slug: 'acme' }] });
  const userClient = makeClient({ membership: row });
  const context = await resolveSupabaseTenantRequestContext({
    trustedRequestHost: 'acme.kfo.sa',
    baseDomain: 'kfo.sa',
    authenticatedUserId: 'user-1',
    publicLookupClient: publicClient,
    userScopedClient: userClient,
  });
  assert.equal(context.kind, 'tenant-member');
  assert.equal(context.membership.organizationId, 'org-acme');
  assert.deepEqual(publicClient.calls.rpc, [{ name: 'resolve_tenant_host', args: { p_hostname: 'acme.kfo.sa' } }]);
  assert.deepEqual(userClient.calls.membershipFilters, [
    { column: 'user_id', value: 'user-1' },
    { column: 'organization_id', value: 'org-acme' },
  ]);
});

test('tenant host alone does not authorize without an active membership', async () => {
  const context = await resolveSupabaseTenantRequestContext({
    trustedRequestHost: 'acme.kfo.sa',
    baseDomain: 'kfo.sa',
    authenticatedUserId: null,
    publicLookupClient: makeClient({ hostRows: [{ organization_id: 'org-acme', tenant_slug: 'acme' }] }),
    userScopedClient: makeClient(),
  });
  assert.equal(context.kind, 'tenant-anonymous');
});

test('membership and host lookup errors fail closed', async () => {
  await assert.rejects(
    resolveSupabaseTenantRequestContext({
      trustedRequestHost: 'acme.kfo.sa',
      baseDomain: 'kfo.sa',
      authenticatedUserId: 'user-1',
      publicLookupClient: makeClient({ hostRows: [{ organization_id: 'org-acme', tenant_slug: 'acme' }] }),
      userScopedClient: makeClient({ membershipError: { message: 'database unavailable' } }),
    }),
    TenantLookupFailed,
  );

  await assert.rejects(
    resolveSupabaseTenantRequestContext({
      trustedRequestHost: 'acme.kfo.sa',
      baseDomain: 'kfo.sa',
      authenticatedUserId: null,
      publicLookupClient: makeClient({ hostError: { message: 'rpc unavailable' } }),
      userScopedClient: makeClient(),
    }),
    TenantLookupFailed,
  );
});

test('does not allow a queried membership for a different user to authorize', async () => {
  await assert.rejects(
    resolveSupabaseTenantRequestContext({
      trustedRequestHost: 'acme.kfo.sa',
      baseDomain: 'kfo.sa',
      authenticatedUserId: 'user-2',
      publicLookupClient: makeClient({ hostRows: [{ organization_id: 'org-acme', tenant_slug: 'acme' }] }),
      userScopedClient: makeClient({ membership: row }),
    }),
    TenantAccessDenied,
  );
});
