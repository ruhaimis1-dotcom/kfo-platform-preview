# Foundation / Tenant Layer — Implementation Plan

Status: in progress on `agent-os/kfo-tenant-consolidation`.  
Scope: technical foundation only; approved KFO routes/roles/visuals and unresolved product policies remain unchanged.

## Deliverables

| Work package | Scope | Exit evidence |
|---|---|---|
| F0 Stack contract | ADR-001, runtime boundaries, no paid-provider integration | ADR committed; application dependency manifest and preview command documented when app shell begins |
| F1 Host resolution | Normalize trusted host; distinguish public host, `{slug}.kfo.sa`, verified custom domain; reject malformed/reserved/nested hosts | Unit tests; unknown/unverified fails closed |
| F2 Identity/context | One Supabase Auth user; explicit personal or organization context; memberships may span organizations; context switch revalidates active membership | Auth-context tests; no tenant claims as sole authorization |
| F3 Database/RBAC | Organizations, domains, branches/departments, memberships, role assignments, permission catalog, tenant branding, audit | Migrations + RLS/policy tests, including two-tenant denial |
| F4 Storage | Private tenant bucket; first key segment is organization UUID; Storage policies use the same permission predicates; signed URL only after server check | Cross-tenant object tests for list/read/write/delete |
| F5 Integration boundary | Typed tenant resolver and context library; server-only adapters for Supabase | Unit tests; no UI/route/brand redesign |
| F6 Checkpoint | QA/security evidence and known gaps | Human review before any main merge/production release |

## Schema/migration sequence
1. `0001_tenant_foundation.sql`: tenant/org identity, verified host aliases, branches/departments, memberships, existing role codes, role/permission mappings, constrained tenant branding, audit events, host-resolution/create-organization functions, RLS and explicit grants.
2. `0002_tenant_storage.sql`: private bucket, tenant object-key convention, private Storage RLS, safe UUID parser.
3. Future domain migrations only when their implementation phase begins: course/content ownership and versioning; learning progress/assessment; certificates/verification read model; commerce/orders/seats/entitlements; reporting. They must include `organization_id`/learning context and tenant tests before exposure.

## Auth and tenant-resolution flow
1. Hosting adapter obtains the normalized request host from its trusted request metadata; do not prefer arbitrary `X-Forwarded-Host` unless the trusted proxy overwrites it.
2. Public KFO host resolves to no company tenant. `{slug}.kfo.sa` maps by normalized slug. Custom hostname maps only when `organization_domains.status = verified` and organization is active.
3. Unknown, nested, malformed, reserved or unverified hosts stop with a non-leaking not-found response.
4. Supabase Auth verifies the session and returns the stable KFO user id.
5. Tenant host selects portal context; on `/business/*`, requested organization is only a selector. Server loads active membership and scoped roles for that user and organization.
6. Server performs permission check and queries with the user JWT so PostgreSQL RLS repeats authorization. Do not use the service key for ordinary user reads/writes.
7. Context switch changes the selector only after membership validation and emits an audit event. Membership is rechecked per request to honor suspension/role changes.
8. Employee navigation remains in the Company Employee Portal. Company administration requires the existing authorized company role. Approved route names remain unchanged.

## RBAC policy model
- Preserve role codes SA, CO, BM, EM, IN, TC, CQ, PA, FI, SU.
- Identity is `auth.users.id`; membership is a separate row per organization and may carry branch/department scope; role assignments are membership-scoped.
- Permission lookup intersects active membership + role grant + row organization + optional branch/department scope. The schema uses an internal `tenant_access_enabled` fail-closed switch; it does not define product lifecycle states or suspension/reactivation policy.
- Explicitly unresolved permissions remain denied. In particular, no FI private-content permission is seeded; content-manager mapping is not invented.

## Tenant storage model
- Private bucket, never public by default.
- Object key format: `<organization_uuid>/<resource_type>/<resource_uuid>/<opaque_filename>`; no email/name in paths.
- Storage metadata and content rows carry organization id and rights/licence/visibility metadata. RLS validates the first object-key segment against active membership and requested permission.
- Browser never supplies an unrestricted bucket/path; use an authorized application action and short-lived signed URL where delivery requires it.
- Use an adapter with `tenantPlacement(organizationId)` contract, defaulting to shared Supabase project/bucket. Dedicated enterprise placement is an adapter/configuration seam only; no provisioning in this phase.

## Tenant isolation test matrix
- Public KFO host, known slug, unknown slug, reserved slug, nested slug, suffix lookalike, malformed host, custom verified/unverified/unknown domain.
- User with personal context and two memberships with different roles; switch between both, then revoked/suspended membership denied immediately.
- Tenant A user cannot select/insert/update/delete/list/count/export Tenant B rows even when supplying B's UUID.
- CO authorized access vs EM blocked from company settings; BM restricted to branch/department; FI has finance-only permissions and cannot read private content by default.
- Tenant storage list/read/upload/update/delete: same-tenant allowed only by permission, cross-tenant denied, malformed key denied, guessed object key denied without authorization.
- Tenant branding validation: reject arbitrary CSS/script and invalid color/media references; keep layout/accessibility tokens controlled.
- Audit context records actor, organization, action, timestamp, scope and before/after for the covered sensitive actions.
- Regression: personal learning stays out of company analytics; public certificate verification excludes email/phone/score.

## Test commands and release gates
- Tenant core unit tests: `npm test --workspace @kfo/tenant-core` (or package-local `npm test`).
- Database policy tests: `supabase test db` against local Supabase/PostgreSQL with pgTAP fixtures.
- API integration tests: call the actual request/service layer with two identities and two tenants; never rely only on helper-function unit tests.
- Security review checks RLS enabled on every exposed table, minimal grants, no service key in client, safe views/RPCs, and Storage policies.
- Any failed cross-tenant negative test blocks checkpoint exit. No live payment integration, main merge, or production deployment in this checkpoint.
