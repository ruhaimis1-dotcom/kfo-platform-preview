# KFO Data Model & RBAC Contract

Status: reconciled with Organization Tenant Architecture locked 23 Sep 2026 and KFO Approved Checkpoint 20 Sep 2026. Binding for Foundation/Tenant Layer implementation.

## Identity, tenant and membership
- One KFO identity and personal learning context per person; organization access uses separate memberships.
- One identity may hold different roles/scopes in multiple organizations. A membership scopes organization and optional branch/department.
- Host discovery selects context only; it never grants membership or authorization.
- Tenant host aliases map to stable organization ids. `{company-slug}.kfo.sa` is the current host pattern; future custom domains map to the same organization id.
- Preserve approved routes, role names and journeys. Employee Portal and Company Admin Workspace remain distinct and separately authorized.

## Domain model contract
- Identity/access: users, profiles, organizations, tenant host aliases, memberships, branches, departments, invitations, roles/permissions, audit events.
- Tenant configuration: controlled branding, approved contacts, media references, server-only tenant deployment/storage placement abstraction.
- Catalogue/content: courses, course_versions, lessons, assets, paths, path_courses, partner ownership/review metadata.
- Tenant Learning Library: owned, company-created, licensed/purchased, and assigned content links with tenant scope, ownership, rights/licence, visibility, and version metadata. Assignment does not change ownership.
- Learning: progress, lesson progress/checkpoints, resume positions; each row has explicit personal or organization learning context.
- Assessment: assessments, questions/question banks, attempts, answers, review/grading, results.
- Certificates: bound to course version and learning context; verification read model plus expiry/revocation/correction history.
- Company operations: assignments, private content, paths/customization and renewals.
- Commerce: tenant-scoped carts/orders/order items/payments/refunds/gifts/seat purchases/seat pools/entitlements/invoices. Company transactions include `organization_id`.
- Reporting/notifications: explicit organization-scoped derived views and notification context.

## Tenancy and authorization invariants
1. Every tenant-owned row, service query/command and private asset has an authoritative `organization_id` or explicit tenant placement reference.
2. Resolve and validate organization context server-side. A browser-supplied organization id is never authorization.
3. API/services check active membership, role, and branch/department scope; PostgreSQL RLS enforces the data boundary. Missing/ambiguous context fails closed.
4. Host resolution, session identity and membership are distinct. Revalidate membership/authorization per tenant request; context switch is explicit and audited.
5. Shared database/storage is default. Subdomain is not a database boundary. Private object keys include stable organization scope and are never trusted from the caller.
6. Future verified custom domains map to the same organization id without route changes. Commercial enablement remains a Human Decision Gate.
7. Keep tenant placement behind a server-side abstraction for future Enterprise database/storage/infrastructure moves; no dedicated provisioning is implied now.
8. Personal and organization learning contexts remain separate; company reporting excludes personal and other-tenant activity.
9. Employee Portal and Company Admin Workspace remain separate authorized surfaces.
10. Branding is limited to approved logo, portal name, primary/secondary colors, cover/hero, welcome copy and contact fields within KFO design/accessibility constraints. No arbitrary CSS/script or IA changes.
11. Owned/company-created content is private by default and does not consume KFO course seats unless a separately approved limit applies. Public catalogue publishing requires rights/review/commercial approval.
12. Orders, invoices, seat pools, assignments and reports are organization-scoped. Finance visibility follows the existing role gate.
13. Membership end or seat withdrawal never deletes learning/certificate history. Learning/certificates bind to course version and context.
14. Paid entitlement activates only after confirmed payment; pending verification is distinct from failure. Payment references are unique and post-payment failures recoverable/auditable.
15. Assessment rules are configured per course/assessment; manual grading requires review; certificate eligibility is server-enforced.
16. Public certificate verification exposes approved facts only, never email/phone/score. Sensitive actions are audited.

## Existing roles (do not rename)
SA platform admin; CO company admin; BM branch/department manager; EM employee; IN trainer; TC training center; CQ quality reviewer; PA partner admin; FI finance admin; SU individual user. Fine-grained permission mappings follow approved source matrix; unresolved rights are denied.

## Technical implementation contract (ADR-001, accepted 24 Sep 2026)
- Next.js App Router, React and TypeScript; server-only request/auth/data adapters; keep Arabic RTL system, approved routes and visuals.
- Supabase Auth provides the stable KFO user id. Host/active organization is a selector; each request revalidates membership and scope. Do not rely on long-lived tenant JWT claims.
- Shared PostgreSQL is default. Every tenant-owned table receives RLS and explicit grants; API/service authorization is also required.
- Verified `{company-slug}.kfo.sa` and future custom host aliases map to an organization. Unknown/unverified hosts fail closed.
- Private Supabase Storage uses organization UUID as key prefix, Storage RLS, and server-authorized short-lived signed access.
- Course/content/versioning, progress, assessment, certificate, commerce and reporting tables arrive in their Task Graph phases with tenant/context scope. No live payment integration in Foundation.
- “Taa” is an **Unavailable Reference**; no supplied content is inferred and no accepted contract requires it as a technical dependency. See `ADR-001-TECHNICAL-STACK.md`.

## Human Decision Gates — preserve as gates
- Content-manager role mapping and approval/publishing rights.
- FI access to private company content and any expanded finance authority.
- Organization lifecycle and suspension/reactivation policy.
- Revenue share, seat withdrawal after learning starts, refunds, default passing and renewal rules.
- Commercial packaging for attribution removal/white label, custom-domain activation, and tenant private-content/platform limits.

These do not block the current technical foundation where conservative deny-by-default behavior is possible. Do not decide them in code.

## Foundation/Tenant Layer exit evidence
- Known host maps to one organization; malformed, unknown, colliding, nested and unverified hosts fail closed.
- One user with personal context and two memberships can switch only after active membership validation.
- Tenant A cannot read, mutate, enumerate, export or obtain signed access to Tenant B data/files at API, service, database and storage boundaries.
- CO/BM/EM/FI decisions respect existing scope and unresolved rights remain denied.
- Personal learning stays out of company reporting; company content/licensing and seat behavior follow the invariants above.
- Branding accepts only controlled values/media; audit records include actor, tenant, scope and time.
- Existing approved checkpoint paths, roles, journeys and visuals remain unchanged.
