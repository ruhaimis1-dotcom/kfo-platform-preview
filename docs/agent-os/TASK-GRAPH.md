# KFO Agent OS Task Graph

## Authority and guardrails
KFO Approved Checkpoint 2026-09-20 is the visual/product source of truth. KFO Master Spec, Data/RBAC Contract and this Task Graph are the Agent OS contracts. Organization Tenant Architecture is locked. Do not rediscover product, change identity, rename routes/roles/journeys, treat `index.html` as production, or publish automatically. Company page previews are architecture references only unless separately visually approved.

## Completed source and architecture gates
- A0 repository audit: static preview is reference only.
- A1 checkpoint reconciliation: approved public/learner visuals and identity recorded.
- A2 Master Spec reconciled with Organization Tenant Architecture.
- A3 Data/RBAC reconciled across identity, host/session, database/storage isolation, branding, company workspaces, library/licensing, reporting and commerce.
- AC0–AC7 Company Architecture Consolidation Gate: **ACCEPTED by product owner 24 Sep 2026**.
- I0 visible repository inventory: **COMPLETE**.
- Checkpoint 0: **ACCEPTED**.

## Design continuation
Company architecture gates already approved: Training Dashboard; Employees & Teams; Company Courses, Content & Seats; Training Assignment; Reports & Certificates; Organization Tenant Architecture. Visual design remains governed only by the approved checkpoint.
- D0 Orders & Invoices tenant architecture reconciliation.
- D1 Company Settings tenant architecture reconciliation.
- D2–D8 company visual previews in approved sequence. Each needs Human Approval; do not infer approval from navigation/sidebar.

## Foundation/Tenant Layer Checkpoint 0

Current branch: `agent-os/kfo-tenant-consolidation`, based on `agent-os/kfo-master-spec`; Draft PR #2 remains open. No merge to `main` or production deployment.

- I1 Technical ADR: **COMPLETE**. ADR-001 selects Next.js App Router + React + TypeScript, Supabase Auth, shared PostgreSQL/RLS, private Supabase Storage. “Taa” is an **Unavailable Reference**, non-blocking under the accepted contracts.
- I2 Tenant resolution/context: framework-neutral request-context boundary and Supabase read adapter implemented. Public host uses the limited host RPC; membership lookup is filtered by user + organization through the request-scoped user JWT. Host/org mismatch fails closed. Unit tests pass 17/17. Next.js trusted-host extraction + Supabase SSR `auth.getUser()` wiring and real runtime context switching remain for app-shell integration.
- I3 Persistence/RBAC: both foundation and Storage migrations are applied to the dedicated KFO project `ktkdcfxeaicbykdurlfg` (EU Central, PostgreSQL 17). All 11 public tables have RLS enabled; 10 approved role codes and 18 permission codes are seeded. API/service integration remains.
- I4 Storage: private `tenant-private` bucket and organization UUID prefix policies are applied. Runtime cross-tenant list/read/write/delete and signed-access tests remain.
- I5 QA: host/context/request-context/Supabase adapter unit tests pass **17/17**. Security advisors report no findings. Performance advisors report 9 unindexed foreign keys and 3 multiple-permissive-SELECT warnings. The authored pgTAP suite was not executable because pgTAP is not installed in the hosted database; API/Storage negative tests remain.
- I6 checkpoint: capture actual database/API/storage results and unresolved gates before Human Approval.

## Foundation schema sequence
1. `202609240001_tenant_foundation.sql`: organizations, verified hosts/custom-domain requests, branches/departments, identity memberships, existing role codes, permissions, controlled branding, audit, helper functions, RLS and explicit grants.
2. `202609240002_tenant_storage.sql`: private bucket and tenant-prefixed object access policies. Applied to KFO project on 24 Sep 2026; migrations recorded as `20260924080920` and `20260924080939`.
3. Later graph phases add scoped course/version/library/licensing, progress/assessment, certificate/public verification read model, order/payment/seat/entitlement and reporting schemas. Do not add speculative product policy in Foundation.

## Implementation DAG
- B2 Identity/Auth/profile/use-type; preserve single identity and explicit personal/company context.
- B3 Organizations/branches/departments/memberships/invitations.
- B4 RBAC + tenant isolation + audit. Gate G1 requires database/API/service/Storage cross-tenant negative tests.
- C1 Catalogue/content/versioning. Gate G2 published course display by availability.
- C2 Commerce/orders/payments/seats/gifts/entitlements. Gate G3 confirmed payment -> traceable entitlement; do not integrate live payments before its phase and approval.
- C3 Learning/player/progress/checkpoints/final assessment. Gate G4 course-rule completion.
- C4 Certificates/QR/public verification/expiry/revocation/correction. Gate G5 version/context/state security.
- C5 Company assignments/customization/basic paths/private content/reporting. Gate G6 company seat-to-employee-result journey.
- C6 Partner portal/review/sales. Gate G7 partner course review/sale journey.

## Cross-cutting QA and release gates
Q1 persistence; Q2 server authorization; Q3 API/database/storage tenant isolation; Q4 error/empty/forbidden/partial failure states; Q5 Arabic RTL/mobile; Q6 audit; Q7 browser journeys; Q8 security; Q9 Human Approval; Q10 release candidate. No main merge or production release without explicit Human Approval.

## Deferred
Advanced skills/gaps/recommendations/readiness; deep Hirely integration; mobile app; advanced partner marketplace; automated settlements.

## Human Decision Gates
Content-manager rights; FI access to private content; organization lifecycle; revenue share; seat withdrawal after learning starts; refunds; passing/renewal defaults; custom-domain/white-label and tenant content commercial packaging. Stack choice is resolved in ADR-001; reopen only with material conflicting technical evidence. Do not invent policy; keep gated capabilities deny-by-default.
