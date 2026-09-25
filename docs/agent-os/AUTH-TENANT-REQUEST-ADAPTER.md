# Authenticated tenant request context

Status: Foundation/Tenant Layer integration in progress. The Next.js/Supabase server boundary is wired in this checkpoint; live Auth and membership validation against tenant fixtures remains pending runtime credentials and test identities.

## Request contract

1. The hosting adapter supplies a normalized host from the trusted request/hosting boundary. Never select a tenant from an untrusted `X-Forwarded-Host` value; forwarded headers must be normalized by trusted infrastructure before reaching the adapter.
2. On each protected request, the server obtains the current user from Supabase Auth `auth.getUser()` using the server's cookie-aware Supabase client. Do not treat a decoded session cookie, client payload, URL parameter, or `getSession()` as server-verified identity.
3. `resolveTenantRequestContext` resolves the verified host to public, verified KFO subdomain, or verified custom-domain context. Unknown, malformed, or unverified hosts fail closed.
4. A tenant host provides organization display scope only. For protected Company Admin Workspace or Employee Portal requests, the server must query the user's current membership using the authenticated Supabase client and require `status = active`.
5. A requested organization selector on a tenant host must match the resolved host organization. On the public host, an explicit company-context selection is allowed only after membership validation. Context switching updates server session/application context but does not grant a role.
6. Roles and permissions remain server/database authorization decisions. Pass the authenticated JWT through to PostgreSQL so RLS applies; do not use a service-role client for user-scoped membership or content reads.

## Implemented seams

`packages/tenant-core/src/request-context.ts` accepts the trusted hostname, a server-verified user id, a verified-domain lookup, and a membership lookup. It returns one of `public`, `tenant-anonymous`, or `tenant-member`; the `requireTenantMembership` guard fails closed for routes that require membership.

`packages/tenant-core/src/supabase-request-adapter.ts` binds those rules to the schema contract: public host lookup uses the column-limited `resolve_tenant_host` RPC; membership lookup uses the user-scoped client with both `user_id` and `organization_id` filters; errors fail closed. The Supabase interfaces are structural so they can be unit-tested without shipping a fake project or credentials. Use two request-scoped clients: a clean anon/publishable-key client for public host resolution and the cookie/JWT user client for membership. Never pass a service-role client into the user-scoped slot.

## Next.js integration implemented

- `lib/supabase/server.ts` creates a cookie-aware request-scoped user client and never accepts a service-role key.
- `lib/supabase/public.ts` creates a separate clean publishable-key client for the limited host RPC.
- `lib/tenant/request-context.ts` calls `auth.getUser()` for a fresh server-verified identity. The expected no-session case becomes anonymous context; other Auth failures fail closed. It then invokes the tested tenant-core adapter.
- `proxy.ts` runs only on API routes and refreshes Supabase Auth token cookies using `getClaims()`. It does not authorize users, organizations, roles, or routes.
- `GET /api/tenant/context` resolves host and optional `organization_id` selector, revalidates active membership on the user-scoped client, returns no-store context only, and maps unknown host/nonmember/backend failures to 404/403/503. This endpoint establishes context only; each protected API/service must still check the permission and rely on RLS.
- The Next.js root shell preserves the existing `index.html` bit-for-bit as a reference iframe at `/kfo-preview.html`. It is explicitly not the final product application; the original `index.html` remains unchanged.
- Root `package.json` pins Next.js/React/Supabase packages and commits an npm lockfile. No service-role or project credentials are committed; see `.env.example`.

## Remaining runtime verification

- Configure local/preview runtime with the dedicated KFO project's URL and publishable key through the environment (never commit keys). The KFO project is already provisioned and contains the four Foundation migrations.
- Add/obtain isolated test identities and two tenant fixtures, then test valid/invalid/no-session contexts, organization selector tampering, revoked/suspended memberships and verified/unverified hosts against the running API.
- Add service/API negative tests for read/write/list/export plus runtime Storage API list/read/write/delete/signed access. Current pgTAP covers database RLS and Storage object policies, not HTTP object operations.
- Roles/permissions are not returned by the context endpoint. The future Company Admin Workspace and Employee Portal must remain separate; route/service permission enforcement is a separate authorization check.
- The application uses the Host value delivered to Next.js and deliberately ignores `X-Forwarded-Host`. Configure Vercel/custom-domain routing so only platform-validated hostnames reach the deployment; custom host resolution additionally requires a verified domain row.

No live payment integration is part of this slice. No production configuration, product policy, approved route names, or visual identity is changed.
