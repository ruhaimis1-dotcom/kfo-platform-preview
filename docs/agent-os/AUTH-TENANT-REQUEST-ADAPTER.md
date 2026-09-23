# Authenticated tenant request context

Status: Foundation Checkpoint 0 implementation slice. This document records the server boundary implemented in `@kfo/tenant-core`; it does not claim the future Next.js/Supabase runtime wiring is complete.

## Request contract

1. The hosting adapter supplies a normalized host from the trusted request/hosting boundary. Never select a tenant from an untrusted `X-Forwarded-Host` value; forwarded headers must be normalized by trusted infrastructure before reaching the adapter.
2. On each protected request, the server obtains the current user from Supabase Auth `auth.getUser()` using the server's cookie-aware Supabase client. Do not treat a decoded session cookie, client payload, URL parameter, or `getSession()` as server-verified identity.
3. `resolveTenantRequestContext` resolves the verified host to public, verified KFO subdomain, or verified custom-domain context. Unknown, malformed, or unverified hosts fail closed.
4. A tenant host provides organization display scope only. For protected Company Admin Workspace or Employee Portal requests, the server must query the user's current membership using the authenticated Supabase client and require `status = active`.
5. A requested organization selector on a tenant host must match the resolved host organization. On the public host, an explicit company-context selection is allowed only after membership validation. Context switching updates server session/application context but does not grant a role.
6. Roles and permissions remain server/database authorization decisions. Pass the authenticated JWT through to PostgreSQL so RLS applies; do not use a service-role client for user-scoped membership or content reads.

## Implemented seam

`packages/tenant-core/src/request-context.ts` accepts the trusted hostname, a server-verified user id, a verified-domain lookup, and a membership lookup. It returns one of `public`, `tenant-anonymous`, or `tenant-member`; the `requireTenantMembership` guard fails closed for routes that require membership. Dependency injection keeps host parsing and context rules testable without pretending a local mock is a Supabase integration.

## Integration pending

When the Next.js App Router shell and Supabase project are provisioned:

- Add the official Supabase SSR server/browser client setup and cookie refresh proxy for the selected Next.js version.
- Build a server-only adapter that gets the trusted host from the framework request, calls `auth.getUser()`, and implements domain/membership lookups with the end-user JWT and RLS.
- Ensure the proxy refreshes cookies but does not make authorization decisions; repeat `getUser()` and membership authorization in protected server routes/actions.
- Add API-level tests for cross-tenant reads/writes, tenant selector tampering, revoked/suspended membership on an existing session, host spoofing boundaries, and anonymous/unauthorized route access.
- Run migration/pgTAP tests against the linked non-production Supabase project, then exercise Storage list/read/write/delete isolation.

No live payment integration is part of this slice. No production configuration, product policy, route names, or visual identity is changed.
