# KFO Agent OS Task Graph

## Authority and guardrails
Approved Checkpoint 20 Sep 2026 is the visual/product source of truth. KFO Master Spec, Data/RBAC Contract and this Task Graph are the current Agent OS architecture contracts. Organization Tenant Architecture is locked 23 Sep 2026. Do not rediscover product, change visual identity, rename routes/roles/journeys, treat `index.html` as production, or auto-publish. Company page previews approved earlier for architecture only remain non-authoritative visually; only the checkpoint controls visual identity.

## Completed source gates
A0 Repository audit: static preview identified; `index.html` is a visual/reference artifact, not final application.
A1 Checkpoint reconciliation: 16 public/learner previews and KFO identity/page map ingested; company previews not visually approved.
A2 Master Spec reconciled with locked Organization Tenant Architecture.
A3 Data/RBAC reconciled with identity, tenant, host/session, shared database, storage, branding, two company experiences, library/licensing, reporting and commerce invariants.

## Current Gate — Company Architecture Consolidation
AC0 Domain and tenant identity: stable organization root, host aliases, tenant slug, future custom-domain boundary.
AC1 RBAC and request context: one identity, explicit personal/tenant context, scoped memberships/roles, fail-closed server authorization.
AC2 Database and storage isolation: shared multi-tenant default with organization_id enforcement; private assets tenant-scoped; future dedicated placement seam.
AC3 Branding and portal boundary: controlled tenant tokens/content under KFO system; separate Employee Portal and Company Admin Workspace.
AC4 Library, operations, analytics and commerce: owned/company-created/licensed/assigned content, assignments, seats, reports, orders/invoices explicitly tenant-scoped.
AC5 Route, identity and visual preservation: approved routes/roles/journeys remain unchanged; checkpoint remains sole visual authority.
AC6 Human Decision Gate inventory: unresolved product/commercial policies are named, scoped and deny-by-default where possible.
AC7 Repository inventory: classify actual implementation artifacts vs reference/static files; do not infer implementation from preview.
Exit criteria: each area has one coherent contract; disagreements are either resolved by existing approved sources or explicitly recorded as Human Decision Gates; no unresolved architecture contradiction blocks the Foundation/Tenant Layer. Status: ACCEPTED by product owner 24 Sep 2026. Architecture Gate closed; implementation may proceed only through the checkpoint below and its gates.

## Design continuation
Company experience architecture gates already approved: Training Dashboard; Employees & Teams; Company Courses, Content & Seats; Training Assignment; Reports & Certificates; Organization Tenant Architecture. These are architecture decisions only. Company visual design remains pending and must use KFO Approved Checkpoint identity.
D0 Orders & Invoices reconciliation with tenant architecture [NEXT DESIGN/PRODUCT DETAIL after architecture gate].
D1 Company Settings reconciliation with tenant architecture.
D2-D6 company visual previews in the approved order from checkpoint: Training Dashboard; Employees & Teams; Courses & Seats; Training Assignment; Reports & Certificates; Orders & Invoices; Company Settings. Each visual page needs Human Approval; no implementation inferred from sidebar existence.

## First Implementation Checkpoint

Checkpoint 0 prepared; repository inventory I0 complete for the complete visible GitHub tree. Findings and technical ADR boundary are recorded in `docs/agent-os/FOUNDATION-TENANT-IMPLEMENTATION-CHECKPOINT-0.md`. No application implementation has started.


I0 Inventory baseline: COMPLETE for the visible repository tree. Only the static preview and assets plus Agent OS docs are present; no app scaffold, package manifest, backend, migrations, storage policies or test harness were found. See Checkpoint 0.
I1 Technical ADR: OPEN. Repository inventory does not prove a framework/database choice. Reconcile approved source materials and deployment constraints, then record one concrete technical choice before coding.
I2 Tenant Resolution + Context Foundation: host resolver and alias abstraction; stable organization context; identity/session separation; explicit tenant switching; fail-closed unknown hosts.
I3 Persistence and authorization boundary: organization_id conventions, tenant-aware repositories/services/policies, database isolation mechanism, migration baseline, audit context.
I4 Storage boundary: tenant-scoped object key strategy and server-authorized access; tenant placement abstraction without dedicated provisioning.
I5 Foundation QA: two-tenant negative tests, multi-membership, role/scope tests, storage authorization, unknown host, context switching, audit; mobile/RTL smoke for shell only.
I6 Checkpoint: implementation evidence, migration/architecture snapshot, tests and unresolved gates. Stop for Human Approval before any public release, merge to main or production publish.
Architecture Gate is accepted. Checkpoint 0 is prepared; production implementation is still not started.

## Implementation DAG after checkpoint approval
B2 Identity/auth/profile/use-type flow.
B3 Organizations/branches/departments/memberships/invitations.
B4 RBAC + tenant isolation + audit. Gate G1 foundation exit tests.
C1 Catalogue/content/versioning. Gate G2 published course display by availability.
C2 Commerce/orders/payments/seats/gifts/entitlements. Gate G3 confirmed payment -> traceable entitlement.
C3 Reliable learning/player/progress/checkpoints/final assessment. Gate G4 course-rule completion.
C4 Certificates/QR/public verification/expiry/revocation/correction. Gate G5 certificate/version/state.
C5 Company assignments/customization/basic paths/private content/reporting. Gate G6 company seat-to-employee-result journey.
C6 Partner basic portal/review/sales. Gate G7 partner course review/sale journey.

## Cross-cutting QA / release gates
Q1 real persistence; Q2 server authorization; Q3 API/database/storage tenant isolation; Q4 loading/empty/error/forbidden/not-found/offline/unsaved/partial-failure states; Q5 Arabic RTL + mobile; Q6 audit sensitive actions; Q7 browser journey tests; Q8 security gate; Q9 human approval; Q10 release candidate. No production implementation before architecture approval; no main merge or production publish without Human Approval.

## Deferred
Advanced skills/gaps/recommendations/readiness; deep Hirely integration; mobile app; advanced partner marketplace; automated settlements.

## Human Decision Gates
Content-manager role mapping; FI access to private company content; unified organization lifecycle and suspension/reactivation; revenue share; seat withdrawal after learning starts; refunds; passing/renewal defaults; custom-domain/white-label and tenant private-content commercial packaging; backend choice only if source inventory proves it materially changes the existing design choice. Do not invent decisions; keep affected features gated and fail closed.
