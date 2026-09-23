import { resolveTenantRequestContext, type TenantRequestContext } from './request-context.ts';
import { normalizeHostname } from './host-resolution.ts';
import type { TenantMembership } from './tenant-context.ts';

type SupabaseError = { message: string };
type SupabaseResult<T> = PromiseLike<{ data: T | null; error: SupabaseError | null }>;

type ResolvedHostRow = {
  organization_id: string;
  tenant_slug: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  organization_id: string;
  status: TenantMembership['status'];
  branch_id: string | null;
  department_id: string | null;
};

type MembershipQuery = {
  eq(column: 'user_id' | 'organization_id', value: string): MembershipQuery;
  maybeSingle(): SupabaseResult<MembershipRow>;
};

/** Narrow structural interface so domain rules remain unit-testable without an app shell. */
export type SupabaseTenantReadClient = {
  rpc(
    functionName: 'resolve_tenant_host',
    args: { p_hostname: string },
  ): SupabaseResult<ResolvedHostRow[]>;
  from(tableName: 'organization_memberships'): {
    select(columns: 'id,user_id,organization_id,status,branch_id,department_id'): MembershipQuery;
  };
};

export class TenantLookupFailed extends Error {
  readonly code = 'TENANT_LOOKUP_FAILED';
  readonly operation: 'host' | 'membership';
  constructor(operation: 'host' | 'membership') {
    super(`Tenant ${operation} lookup failed.`);
    this.name = 'TenantLookupFailed';
    this.operation = operation;
  }
}

/**
 * Bind the shared request-context rules to Supabase reads.
 *
 * `publicLookupClient` must be a separate anon/publishable-key client without the
 * user's cookie session, so the limited public host RPC does not inherit an
 * authenticated role. `userScopedClient` must carry this request's user JWT and
 * must never be a service-role client. `authenticatedUserId` must come from a
 * fresh server-side Supabase Auth verification (prefer `auth.getUser()` where
 * current account/session revocation state is required).
 */
export async function resolveSupabaseTenantRequestContext(input: {
  trustedRequestHost: string;
  baseDomain: string;
  authenticatedUserId: string | null;
  requestedOrganizationId?: string | null;
  publicLookupClient: SupabaseTenantReadClient;
  userScopedClient: SupabaseTenantReadClient;
}): Promise<TenantRequestContext> {
  const normalizedBaseDomain = normalizeHostname(input.baseDomain);
  return resolveTenantRequestContext(
    {
      trustedRequestHost: input.trustedRequestHost,
      authenticatedUserId: input.authenticatedUserId,
      requestedOrganizationId: input.requestedOrganizationId,
    },
    {
      baseDomain: input.baseDomain,
      lookupDomain: async (hostname) => {
        const { data, error } = await input.publicLookupClient.rpc('resolve_tenant_host', {
          p_hostname: hostname,
        });
        if (error) throw new TenantLookupFailed('host');
        const row = data?.[0];
        if (!row || !row.organization_id || !row.tenant_slug) return null;
        return {
          organizationId: row.organization_id,
          verified: true,
          domainType: normalizedBaseDomain && hostname.endsWith(`.${normalizedBaseDomain}`)
            ? 'kfo_subdomain'
            : 'custom',
        };
      },
      findMembership: async (userId, organizationId) => {
        const { data, error } = await input.userScopedClient
          .from('organization_memberships')
          .select('id,user_id,organization_id,status,branch_id,department_id')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .maybeSingle();
        if (error) throw new TenantLookupFailed('membership');
        if (!data) return null;
        return {
          membershipId: data.id,
          userId: data.user_id,
          organizationId: data.organization_id,
          status: data.status,
          branchId: data.branch_id,
          departmentId: data.department_id,
        };
      },
    },
  );
}
