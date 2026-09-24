# Foundation / Tenant Layer — Implementation Plan

Status: in progress on `agent-os/kfo-tenant-consolidation`. Scope is technical foundation only; product decisions, visual identity, routes and role names remain governed by approved contracts.

## Checkpoint 0 progress update (2026-09-24)

- Added a framework-neutral request-context boundary in `packages/tenant-core/src/request-context.ts`.
- Added a Supabase adapter in `packages/tenant-core/src/supabase-request-adapter.ts`: public host lookup uses the limited resolver RPC; membership is rechecked using both user and organization filters through the request-scoped user client.
- It resolves public/subdomain/custom-domain host scope, rejects unverified/unknown hosts, denies organization-selector conflicts, and requires a server-verified identity plus currently active membership for tenant member context.
- Added `docs/agent-os/AUTH-TENANT-REQUEST-ADAPTER.md` with the required Next.js/Supabase SSR integration and API isolation checks.
- Tenant-core tests pass 17/17. This does not replace runtime API or Storage tests. The dedicated KFO project is linked and holds the deployed foundation; the separate Zawed Supabase project was not used.

## Work packages and exit evidence

| ID | Work | Exit evidence |
|---|---|---|
| F0 | ADR-001 stack contract | Decision committed; no external payment integration |
| F1 | Host resolution/context helpers | Unit tests; unknown/unverified host denied |
| F2 | Supabase Auth request/session adapter | Verified identity; tenant selector rechecks active membership per request |
| F3 | Database/RBAC | Migrations plus pgTAP two-tenant tests and API/service authorization tests |
| F4 | Storage | Private bucket, scoped key, list/read/write/delete denial tests and authorized signed access |
| F5 | Tenant placement seam | Server-only resolver defaults to shared placement; no per-tenant provisioning |
| F6 | QA checkpoint | Security/RTL results, known gaps, Human Approval before main/release |

## Migration sequence

1. `20260924080920_kfo_tenant_foundation.sql`: organizations, verified domains, branches/departments, memberships, existing role codes, permission catalog/mappings, constrained branding, audit, host/domain/create helpers, RLS and explicit grants.
2. `20260924080939_kfo_tenant_storage.sql`: private bucket, tenant organization UUID object prefix, Storage RLS.
3. `20260924081958_tenant_host_resolver_grant.sql`: minimal anon column grant for public resolver policies.
4. `20260924082130_tenant_rls_performance.sql`: consolidated read policies and indexes. Names/version numbers match remote migration history.
3. Later Task Graph phases add course/content/version/licensing; learning/progress/assessment; certificates/verification read model; commerce/orders/payments/seats/entitlements; reporting. Each tenant-owned row must carry `organization_id` or an explicit partition reference and tests before exposure.

## Auth and tenant resolution flow

1. Hosting adapter reads normalized host from trusted request metadata; do not trust arbitrary forwarded-host headers.
2. Public KFO host selects no organization. `{company-slug}.kfo.sa` resolves one verified domain row. A future custom host resolves only when its ownership/domain status is verified.
3. Unknown, malformed, reserved, nested, ambiguous, or unverified hosts fail closed with non-leaking not-found behavior.
4. Supabase Auth verifies session and supplies stable KFO `user_id`.
5. Host or explicit active-org choice selects context only. Server loads current membership, status, roles, branch and department scope; revalidate on each tenant request.
6. Server applies the permission check, then queries with the user-scoped JWT so PostgreSQL RLS repeats authorization. Keep service role credentials server-only and outside normal user queries.
7. Explicit context switch succeeds only after membership validation and is audited. Revoked/suspended membership stops access on the next authorization check.
8. Employee Portal and Company Admin Workspace stay separate; existing approved routes do not change.

## Database/RBAC policies

- RLS on every exposed tenant-owned table, with explicit least-privilege grants; RLS alone does not replace API checks.
- Helpers check authenticated user, active membership, organization enabled for technical access, role permission, and optional branch/department scope. Missing scope never widens access.
- Seed only source-supported baseline mappings. No FI private-content access; content manager mapping and organization lifecycle remain unresolved/deny-by-default.
- Tenant provisioning is not exposed as arbitrary public self-service; it must be connected to the already approved company onboarding flow.
- Verified custom domain changes must remain platform-controlled; tenant admins can request only, not self-verify or claim.

## Storage isolation

- Private bucket only. Key shape: `<organization_uuid>/<resource_type>/<resource_uuid>/<opaque_filename>`; never include email/person name.
- Bucket RLS reads organization UUID from the first segment and calls the same membership/permission predicate as database access.
- Client cannot choose an unrestricted key/path. Application action authorizes the resource before upload/download and issues short-lived signed access as needed.
- Keep `tenantPlacement(organizationId)` and storage adapter server-side. Default is shared Supabase; dedicated enterprise placement is a future migration seam, not provisioning now.

## Isolation test matrix

- Hosts: public, known subdomain, unknown/reserved/nested/malformed/suffix-lookalike, verified/unverified custom domain.
- Identities: personal context plus two different tenant memberships; switch to authorized org; reject nonmember, suspended and stale membership.
- Database/API: Tenant A cannot read/write/delete/list/count/export Tenant B records by supplying UUIDs; test both denied and permitted paths.
- RBAC: CO authorized company settings; EM denied admin; BM restricted to assigned branch/department; FI finance-only and denied private content by default.
- Storage: same-tenant authorized access; cross-tenant list/read/upload/update/delete denied; malformed/guessed key denied; signed URLs short-lived and issued only after server checks.
- Data leakage: personal learning excluded from company reporting; public certificate verification omits email/phone/score.
- Audit: actor, organization, action, scope, timestamp and relevant before/after state on sensitive mutation.
- Regression: approved routes, roles, KFO identity and Arabic RTL references remain unchanged.

## Current status and commands

Host/context helpers, request-context boundary, Supabase read adapter, four foundation migrations, and pgTAP fixture are authored and deployed to the KFO Supabase project. Unit tests: 17/17 pass. Hosted tenant isolation/RBAC/host pgTAP: 18/18 pass; fixture and temporary extension were rolled back and no test data persists. Security advisors: 0 findings. Multiple permissive policy and unindexed-FK findings were resolved; unused-index INFO notices remain on this empty schema. No TypeScript compiler, Supabase CLI, PostgreSQL client or Docker is installed in this execution environment. The Next.js/Supabase SSR Auth wiring and API/service/Storage runtime integration test harness still require an application shell.

Run unit tests from `packages/tenant-core` with `npm test`. Re-run `supabase test db` in local/CI once the project shell exists; hosted policy assertions have already passed transactionally. No live payment provider integration, `main` merge or production deployment in this checkpoint.
