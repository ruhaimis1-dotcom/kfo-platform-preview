import {
  resolveTenantHost,
  type TenantDomainLookup,
  type TenantHostResolution,
} from './host-resolution.ts';
import {
  activateTenantContext,
  TenantAccessDenied,
  type TenantContext,
  type TenantMembership,
} from './tenant-context.ts';

/**
 * Server boundary for resolving a request's tenant context.
 * `authenticatedUserId` MUST come from a server-verified Auth call (for Supabase,
 * `auth.getUser()`), never from request parameters, cookies decoded by the caller,
 * or a user supplied Authorization payload. Membership must be read on every
 * request through the authenticated database client so RLS remains in force.
 */
export type TenantRequestDependencies = {
  baseDomain: string;
  lookupDomain: TenantDomainLookup;
  findMembership: (userId: string, organizationId: string) => Promise<TenantMembership | null>;
};

export type TenantRequestContext =
  | { kind: 'public'; host: TenantHostResolution & { kind: 'public' } }
  | { kind: 'tenant-anonymous'; host: Exclude<TenantHostResolution, { kind: 'public' | 'unresolved' }> }
  | {
      kind: 'tenant-member';
      host: Exclude<TenantHostResolution, { kind: 'unresolved' }>;
      membership: TenantContext;
    };

export class TenantHostRejected extends Error {
  readonly code = 'TENANT_HOST_REJECTED';
  readonly reason: 'invalid-host' | 'unknown-tenant' | 'unverified-domain';
  constructor(reason: 'invalid-host' | 'unknown-tenant' | 'unverified-domain') {
    super(`Tenant host could not be resolved: ${reason}`);
    this.name = 'TenantHostRejected';
    this.reason = reason;
  }
}

/**
 * Resolve display scope from the trusted host and authorization scope from a
 * freshly verified identity plus an active membership. A host never grants
 * membership. Supplying an organization selector cannot override the host.
 */
export async function resolveTenantRequestContext(input: {
  trustedRequestHost: string;
  authenticatedUserId: string | null;
  requestedOrganizationId?: string | null;
}, dependencies: TenantRequestDependencies): Promise<TenantRequestContext> {
  const host = await resolveTenantHost(
    input.trustedRequestHost,
    dependencies.baseDomain,
    dependencies.lookupDomain,
  );
  if (host.kind === 'unresolved') throw new TenantHostRejected(host.reason);

  if (host.kind === 'public') {
    if (input.requestedOrganizationId) {
      // Public host can host a signed-in personal context, but only after membership validation.
      const membership = await activateTenantContext(
        input.authenticatedUserId,
        input.requestedOrganizationId,
        dependencies.findMembership,
      );
      return {
        kind: 'tenant-member',
        host,
        membership,
      };
    }
    return { kind: 'public', host };
  }

  if (
    input.requestedOrganizationId &&
    input.requestedOrganizationId !== host.organizationId
  ) throw new TenantAccessDenied();

  if (!input.authenticatedUserId) return { kind: 'tenant-anonymous', host };
  const membership = await activateTenantContext(
    input.authenticatedUserId,
    host.organizationId,
    dependencies.findMembership,
  );
  return { kind: 'tenant-member', host, membership };
}

/** Company-admin and employee tenant routes must require a member context. */
export function requireTenantMembership(context: TenantRequestContext): TenantContext {
  if (context.kind !== 'tenant-member') throw new TenantAccessDenied();
  return context.membership;
}
