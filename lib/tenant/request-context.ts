import 'server-only';

import { AuthSessionMissingError } from '@supabase/supabase-js';
import {
  resolveSupabaseTenantRequestContext,
  type SupabaseTenantReadClient,
} from '@/packages/tenant-core/src/supabase-request-adapter.ts';
import { createPublicLookupClient } from '@/lib/supabase/public';
import { createUserSupabaseClient } from '@/lib/supabase/server';

/**
 * Resolve display tenant from the framework Host header; never read
 * X-Forwarded-Host in application code. The hosting platform must route only
 * configured domains to this deployment. Membership and permissions are
 * separately revalidated by the user-scoped Postgres/RLS client.
 */
export async function resolveRequestTenantContext(
  trustedHost: string,
  requestedOrganizationId?: string | null,
) {
  const userClient = await createUserSupabaseClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError && !(authError instanceof AuthSessionMissingError)) {
    throw new Error('AUTH_VERIFICATION_FAILED');
  }

  return resolveSupabaseTenantRequestContext({
    trustedRequestHost: trustedHost,
    baseDomain: process.env.KFO_BASE_DOMAIN ?? 'kfo.sa',
    authenticatedUserId: user?.id ?? null,
    requestedOrganizationId,
    publicLookupClient: createPublicLookupClient() as unknown as SupabaseTenantReadClient,
    userScopedClient: userClient as unknown as SupabaseTenantReadClient,
  });
}
