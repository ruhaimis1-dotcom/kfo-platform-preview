export type TenantMembership = {
  membershipId: string;
  userId: string;
  organizationId: string;
  status: 'active' | 'invited' | 'suspended' | 'inactive';
  branchId: string | null;
  departmentId: string | null;
};

export type TenantContext = {
  userId: string;
  organizationId: string;
  membershipId: string;
  branchId: string | null;
  departmentId: string | null;
};

export class TenantAccessDenied extends Error {
  readonly code = 'TENANT_ACCESS_DENIED';
  constructor() {
    super('An active membership is required for this organization context.');
    this.name = 'TenantAccessDenied';
  }
}

/** A selected tenant id is only a selector; membership is revalidated server-side. */
export async function activateTenantContext(
  authenticatedUserId: string | null,
  requestedOrganizationId: string,
  findMembership: (userId: string, organizationId: string) => Promise<TenantMembership | null>,
): Promise<TenantContext> {
  if (!authenticatedUserId || !requestedOrganizationId) throw new TenantAccessDenied();
  const membership = await findMembership(authenticatedUserId, requestedOrganizationId);
  if (
    !membership ||
    membership.userId !== authenticatedUserId ||
    membership.organizationId !== requestedOrganizationId ||
    membership.status !== 'active'
  ) throw new TenantAccessDenied();

  return {
    userId: authenticatedUserId,
    organizationId: membership.organizationId,
    membershipId: membership.membershipId,
    branchId: membership.branchId,
    departmentId: membership.departmentId,
  };
}
