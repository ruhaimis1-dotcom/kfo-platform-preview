# KFO Data Model & RBAC Contract

Status: reconciled with Organization Tenant Architecture locked 23 Sep 2026 and KFO Approved Checkpoint 20 Sep 2026. This contract is binding for Foundation/Tenant Layer implementation.

## Identity, tenant and membership
- A person has one KFO identity, profile and personal learning context.
- An organization is the tenant root. Users enter organization context through memberships; the same identity can hold different roles/scopes in multiple organizations.
- Membership is distinct from identity and scopes organization plus optional branch and department. Role grants never exceed that scope.
- Tenant discovery from host selects context; it does not itself grant membership or authorization.
- Tenant host aliases map to a stable organization identifier. Tenant slug is unique; future custom domains map through the same host-alias boundary.
- Approved business routes stay unchanged. `{tenant}.kfo.sa` resolves the Employee Portal context; Company Admin Workspace remains a distinct authorized experience. The employee entry must never redirect into company administration.

## Domain model
Identity/access: users, profiles, organizations/tenant_identity, tenant_host_aliases, memberships, branches, departments, invitations, roles/permissions, audit events.
Tenant configuration: tenant_branding, approved contact details, theme tokens, media references, tenant deployment/storage placement reference (abstraction only; no dedicated infrastructure is implied by default).
Catalogue/content: courses, course_versions, lessons, assets, paths, path_courses, partner ownership/review metadata.
Tenant Learning Library: tenant_content_links with content_origin = owned | company_created | licensed_purchased | assigned; source/content reference, tenant scope, rights/licence metadata, visibility, version. Assignment is a learner-specific projection and preserves the underlying content's ownership.
Commerce: carts, orders, order_items, payments, refunds, gifts, seat_purchases, seat_pools, entitlements/enrolments, invoices. Tenant-scoped company transactions carry organization_id.
Learning: learning_progress, lesson_progress/checkpoints, resume_positions. Each record has an explicit personal or organization context; do not infer reporting scope from user identity.
Assessment: assessments, questions/question_banks, attempts, answers, grading/reviews, results.
Certificates: certificates bound to course_version and learning context, verification identifiers/read model, expiry/revocation/correction records.
Company operations: assignments, private_content, company paths/basic customization, renewals.
Partner: partner profiles, agreements, applications/reviews, sales/settlement records as allowed by phase.
Reporting/notifications: derived organization-scoped reporting views and notifications with explicit tenant context.

## Tenancy and authorization invariants
1. Every tenant-owned row, service command/query and private asset has an authoritative organization_id or an explicit tenant partition reference.
2. Organization context is resolved and validated server-side for every request; clients cannot elevate or switch tenant by supplying an organization_id alone.
3. Database access enforces tenant predicates centrally and at persistence policy boundary; API/services authorization independently checks membership, role and branch/department scope. Fail closed on missing, conflicting or unknown tenant context.
4. Host resolution, session identity and membership are separate checks. Session carries stable user identity and active context; each tenant-scoped request revalidates active membership/authorization. Switching context is explicit and audited.
5. Shared infrastructure is the default. Subdomain is not a database boundary. Tenant storage keys/namespaces include stable tenant scope; private objects use authorized access or short-lived scoped access links. Never trust a caller-supplied object path.
6. Tenant host aliases support future custom domains without changing organization IDs or product routes. Host onboarding, ownership verification and collision policy are implementation mechanisms; commercial enablement remains a Human Decision Gate.
7. Tenant placement is abstracted so a future organization can be routed to dedicated database/storage/infrastructure. Do not implement per-tenant provisioning without a separate approved phase.
8. Personal context and company context remain distinct. Company analytics include only learning explicitly assigned/created in that tenant context; no personal learning leakage.
9. Employee Portal and Company Admin Workspace are separate authorized surfaces, even when one user identity can access both under different memberships/roles.
10. Tenant branding allows logo, portal/academy name, primary/secondary colors, cover/hero, welcome copy and approved contact details within locked KFO Design System, RTL and accessibility limits. Tenant values cannot inject arbitrary CSS/scripts or alter information architecture.
11. Content library distinguishes Owned, Company-created, Licensed/Purchased and Assigned content. Owned and company-created items are private by default and do not consume KFO course seats unless a separately approved platform/commercial limit applies. Publishing to public catalogue requires a distinct rights/review/commercial approval workflow.
12. Orders, invoices, seat pools, assignments and reports are organization-scoped. Company Admin and Employee Portal views use their existing approved route architecture. Finance visibility stays subject to role gate below.
13. Stopping membership or withdrawing a seat does not delete learning/certificate history. Learning/certificate records bind to course_version and explicit learning context.
14. Paid entitlement activates only after confirmed payment; pending verification is distinct from failure. Payment references are unique; post-payment enrolment failure is recoverable/auditable.
15. Assessment timing, attempts, pass score and completion rules are configured per course/assessment. Manual grading cannot publish final result before review. Certificate eligibility is enforced server-side.
16. Public certificate verification exposes only approved facts; never email, phone or score. Sensitive actions are audited with actor, time, tenant, scope and before/after values where applicable.

## Role baseline (existing codes; do not rename)
SA platform admin; CO company admin; BM branch/department manager; EM employee; IN trainer; TC training center; CQ quality reviewer; PA partner admin; FI finance admin; SU individual user.
Role codes remain fixed. Fine-grained permission mappings and scope predicates are implemented from the approved source matrix; unresolved exceptions remain gates.

## Human Decision Gates (do not infer policy)
- Content-manager role mapping and approval rights for company-created content.
- Whether FI can view private company content, beyond any already-approved finance data.
- Unified organization lifecycle states and behavior on suspension/reactivation.
- Revenue share, seat withdrawal after learning begins, refund rules, passing/renewal defaults.
- Commercial packaging for KFO attribution removal/full white label, custom-domain enablement, or platform usage limits for tenant-owned/private content.
- Final backend implementation choice only if concrete source inventory shows it changes the approved PostgreSQL design / Laravel-MySQL implementation option.
- Exact finance/operational authority over Orders & Invoices when it changes the existing role matrix.
These decisions do not block architecture closure where a conservative deny-by-default boundary can be implemented; the affected policy-specific feature stays disabled until decided.

## Foundation/Tenant Layer exit tests
- Resolve known tenant subdomain to exactly one organization; unknown, malformed and colliding hosts fail closed.
- Custom host alias follows same resolution contract when enabled by test fixture; no product/commercial activation implied.
- One identity has personal context and two tenant memberships with different roles/scopes; explicit switch yields correct context and audit event.
- Tenant A cannot read, mutate, enumerate, export or obtain signed access to Tenant B records/assets through API, services, database boundary or storage path.
- Employee cannot access Company Admin Workspace/settings; authorized CO can; BM restricted to branch/department; FI is denied private content until policy is approved.
- Every tenant-owned persistence record and storage reference is tenant-scoped; queries without context fail closed.
- Branding fields are validated against allowed tokens/media/content; cannot inject styles/scripts or bypass KFO layout.
- Company reports exclude personal learning and all other-tenant activity.
- Tenant-owned/company-created content is private by default and does not decrement KFO seats; licensed KFO/partner assignment observes purchased entitlement.
- Orders/invoices, assignments and reports resolve to the active organization only.
- Audit records include actor, action, tenant, scope, timestamp and before/after where applicable.
- Existing checkpoint paths/roles and all approved learner/public flows remain unchanged.
