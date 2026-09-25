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
- D0 Orders & Invoices tenant architecture reconciliation: **COMPLETE**; see `ORDERS-SETTINGS-TENANT-RECONCILIATION.md`. Personal order journeys remain separate from company transaction context; organization records require `organization_id`, membership/permission checks, and RLS.
- D1 Company Settings tenant architecture reconciliation: **COMPLETE**; controlled branding, private tenant media, audited changes, and unresolved domain/lifecycle decisions remain within existing gates. No visual design or product policy was approved by the reconciliation.
- D2 Company Training Dashboard page architecture and breakdown: **APPROVED**. D2 visual proposal: **REJECTED by product owner 25 Sep 2026** for mismatch with the approved visual identity. See `DESIGN-PREVIEW-CHECKPOINT-2.md`; route implementation remains blocked until a replacement visual is approved.
- D3 Employees & Teams, D4 Courses & Seats, D5 Training Assignment, D6 Reports & Certificates, D7 Orders & Invoices, D8 Company Settings: remain in the approved sequence; each visual requires Human Approval before implementation.

## Design-to-implementation continuation
- UI0 Public home implementation started from the visually approved home screen in KFO Approved Checkpoint 2026-09-20. This is an implementation preview, not a design re-approval or a completed production page.
- UI0 uses the approved palette, IBM Plex Sans Arabic / Inter fonts, and the approved public-home composition. On 25 Sep, low-resolution photo crops were replaced by larger crops from approved hero/catalog/course checkpoint renders. After owner feedback, a generated training-workshop photo is now staged as an unapproved hero candidate; approved checkpoint imagery remains available for rollback. Original reusable photo/vector assets are still needed for final asset quality.
- Typeface verification on deployed Preview confirms IBM Plex Sans Arabic active for Arabic and Inter loaded for Latin/numeric use. Numeric and mixed-data fields now declare Inter first with IBM Plex Sans Arabic fallback.
- The public-home visual revision is available in Preview for owner review. It is not a final visual sign-off. The existing root `index.html` remains unchanged as a visual reference, not the app.
- UI1 Public catalogue and certificate preview: `/catalog`, `/catalog/communication-skills`, and `/verify-certificate` implemented from approved checkpoint visuals. Search and category query filtering work on the six illustrative catalogue entries. Certificate sample data is clearly marked and does not perform a database validity check. No live catalogue, checkout, enrollment, entitlement, or certificate lookup is connected; other course cards do not point to an unrelated detail page.
- Owner screen recording confirmed `/business/dashboard`, `/paths`, and `/partners` returned 404 because their route pages were not implemented. `/catalog` is now implemented; `/business/dashboard` remains blocked until its replacement visual is approved. `/paths`, `/partners`, auth, and informational pages remain pending their design gates and route sequence.
- The homepage still contains links to those unimplemented route targets; route coverage is therefore partial and those links may return 404 until their approved page slices ship. Preserve route names; do not fill gaps with unapproved UI.
- Before production readiness: restore approved logo and hero assets from a trusted source; wire the approved route map and backend; implement loading/empty/error/forbidden/offline states; browser QA desktop/mobile/RTL and accessibility; complete human review.

## Foundation/Tenant Layer Checkpoint 0
Current branch: `agent-os/kfo-tenant-consolidation`, based on `agent-os/kfo-master-spec`; Draft PR #2 remains open. No merge to `main` or production deployment.
- I1 Technical ADR: **COMPLETE**. ADR-001 selects Next.js App Router + React + TypeScript, Supabase Auth, shared PostgreSQL/RLS, private Supabase Storage. “Taa” is an **Unavailable Reference**, non-blocking under the accepted contracts.
- I2 Tenant resolution/context: framework-neutral boundary plus Next.js/Supabase SSR adapter implemented. API uses the request Host delivered by the trusted hosting boundary (never `X-Forwarded-Host`), calls `auth.getUser()`, resolves public host metadata through a separate anon client, then filters membership by user + organization through the request-scoped user JWT. Optional organization selector is validated as a selector, never authority. Unit tests pass 17/17; runtime Auth/membership tests against tenant fixtures remain.
- I3 Persistence/RBAC: four migrations are applied to dedicated KFO project `ktkdcfxeaicbykdurlfg` (EU Central, PostgreSQL 17). All 11 public tables have RLS enabled; 10 approved role codes and 18 permission codes are seeded. API/service integration remains.
- I4 Storage: private `tenant-private` bucket and organization UUID prefix policies are applied. Hosted database-level Storage RLS checks pass as part of the 23/23 pgTAP suite: tenant A listing isolation, denial of upload/update under tenant B prefix, and allowed own-tenant upload/update. Runtime Storage API list/read/write/delete, signed-access, and deletion checks remain.
- I5 QA: host/context/request-context/Supabase adapter unit tests pass **17/17**; hosted pgTAP isolation/RBAC/host/Storage suite passes **23/23** using a transaction-scoped fixture. All fixture organizations, memberships and test users were confirmed rolled back; pgTAP is not persistently installed. Security advisors report no findings. Multiple-policy and unindexed-FK warnings were resolved; only unused-index notices remain on the empty schema.
- I6 checkpoint: Next.js App Router root now renders the public-home implementation; existing `index.html` remains reference only. `GET /api/tenant/context` is wired and no-store. Auth, API/service and Storage API isolation against real authenticated fixtures remain before Foundation exit/Human Approval.

## Foundation schema sequence
1. `20260924080920_kfo_tenant_foundation.sql`: organizations, verified hosts/custom-domain requests, branches/departments, identity memberships, existing role codes, permissions, controlled branding, audit, helper functions, RLS and explicit grants.
2. `20260924080939_kfo_tenant_storage.sql`: private bucket and tenant-prefixed object access policies.
3. `20260924081958_tenant_host_resolver_grant.sql`: limited anon grant required by public host-resolution RLS policies.
4. `20260924082130_tenant_rls_performance.sql`: consolidates duplicate SELECT policies and adds foreign-key indexes. All four versions match the KFO project migration history.
5. Later graph phases add scoped course/version/library/licensing, progress/assessment, certificate/public verification read model, order/payment/seat/entitlement and reporting schemas. Do not add speculative product policy in Foundation.

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
