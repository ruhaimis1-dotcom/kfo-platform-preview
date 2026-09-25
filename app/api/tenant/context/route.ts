import { NextRequest, NextResponse } from 'next/server';
import { TenantHostRejected } from '@/packages/tenant-core/src/request-context.ts';
import { TenantAccessDenied } from '@/packages/tenant-core/src/tenant-context.ts';
import { TenantLookupFailed } from '@/packages/tenant-core/src/supabase-request-adapter.ts';
import { resolveRequestTenantContext } from '@/lib/tenant/request-context';

export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  if (!host) return json({ error: 'TENANT_HOST_REJECTED' }, 400);
  const requestedOrganizationId = request.nextUrl.searchParams.get('organization_id');

  try {
    const context = await resolveRequestTenantContext(host, requestedOrganizationId);
    const body = context.kind === 'tenant-member'
      ? {
          kind: context.kind,
          tenant: {
            organizationId: context.membership.organizationId,
            membershipId: context.membership.membershipId,
            branchId: context.membership.branchId,
            departmentId: context.membership.departmentId,
          },
        }
      : { kind: context.kind };

    return json(body);
  } catch (error) {
    if (error instanceof TenantHostRejected) {
      return json({ error: error.code }, 404);
    }
    if (error instanceof TenantAccessDenied) {
      return json({ error: error.code }, 403);
    }
    if (error instanceof TenantLookupFailed) {
      return json({ error: error.code }, 503);
    }
    if (error instanceof Error && error.message === 'AUTH_VERIFICATION_FAILED') {
      return json({ error: error.message }, 503);
    }
    return json({ error: 'TENANT_CONTEXT_UNAVAILABLE' }, 503);
  }
}
