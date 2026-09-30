# KFO Agent OS Task Graph

## Authority
Approved Checkpoint 20 Sep 2026 is the current source of truth. Do not rediscover product, rename approved routes, change identity, or auto-publish.

## Completed gates
A0 repository audit: static preview identified.
A1 checkpoint reconciliation: approved 16 learner/public previews + architecture v1.1 + visual identity ingested.
A2 Master Spec reconciled.
A3 Data/RBAC contract reconciled.

## Design continuation — exact current checkpoint
D0 Company Training Dashboard visual preview [DESIGN APPROVED — SAUD, 28 SEP 2026]
D1 Employees & Teams [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
D2 Courses & Seats [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
D3 Training Assignment [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
D4 Reports & Certificates [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
D5 Orders & Invoices [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
D6 Company Settings [DESIGN APPROVED — SAUD, 28 SEP 2026; PHONE QA OPEN]
Design pages must follow approved KFO identity. Each internal page must be reviewed; sidebar links alone are not completion.

## Implementation DAG
B0 Source inventory/mapping [SOURCE INSPECTION COMPLETE — 28 SEP 2026]: `B0-SOURCE-INVENTORY.md` maps current previews, approved checkpoint and archived frontend/backend to domains/pages/API/entities/tests. Runtime and cross-tenant behavior remain unverified.
B1 Foundation app architecture and chosen stack [blocked by Human Decision Gate only if final backend choice materially differs from available source].
B1 preflight [28 SEP 2026]: `B1-TEST-AND-ENVIRONMENT-GATE.md`; auth/build/route checks pass. KFO Supabase tenant schema inspected; public resolver/RLS scope corrected. Transactional anonymous and authenticated membership/branch read-isolation tests pass. Existing trusted database organization bootstrap also passes. Application entrypoints for bootstrap/invitation/settings and HTTP API isolation tests remain pending.
B1 invitation slice [DATABASE TEST PASSED — 29 SEP 2026]: `B1-INVITATION-ACCEPTANCE.md` and migration/test SQL for existing-user acceptance. Migration applied to KFO and transactional SQL role/audit test passed with rollback; authenticated HTTP session test remains required before UI use. Email-address invitation issuance and delivery remain separate.
B1 company name setting [DATABASE TEST PASSED — 29 SEP 2026]: `B1-COMPANY-NAME-SETTING.md` and narrow RPC/migration/test SQL. Owner role, employee/anonymous/cross-tenant denial, input validation and audit passed in a rolled-back transaction. Authenticated HTTP and D6 UI wiring remain pending.
B1 existing-user employee invite issuance [DATABASE TEST PASSED — 29 SEP 2026]: `B1-EXISTING-USER-INVITE-ISSUANCE.md` and atomic membership/EM role RPC. Issuance → acceptance and isolation passed in rolled-back SQL; email delivery, pending-user claim, authenticated HTTP and D1 UI wiring remain pending.
B2 Identity/auth/profile/use-type flow.
B1 browser HTTP gate [EM LIVE HTTP PASSED — 30 SEP 2026]: `B1-BROWSER-HTTP-GATE.md` and `/auth-check` use a real browser session with fixed QA memberships. Three accounts and CO/BM/EM test memberships exist; EM independently reads active through HTTP; all 9 EM live checks pass (active retries, not first acceptance). Verified existing-session login redirect and real membership landing are deployed. Build and 23 local tests pass. BM/CO HTTP, audit verification (connector permission denied), cross-tenant HTTP/Storage and role-specific business UI wiring remain open.
B3 Organizations/branches/departments/memberships/invitations.
B4 RBAC + tenant isolation + audit.
Gate G1: foundation exit tests.

C1 Catalogue/content/versioning.
Gate G2: published course display by availability.
C2 Commerce/orders/payments/seats/gifts/entitlements.
Gate G3: successful payment produces traceable correct entitlement.
C3 Reliable learning/player/progress/checkpoints/final assessment.
Gate G4: completion requires course rules.
C4 Certificates/QR/public verification/expiry/revocation/correction.
Gate G5: certificate bound to course version and verification state correct.
C5 Company assignments/customization/basic paths/private content/reporting.
Gate G6: full company seat-to-employee-result journey.
C6 Partner basic portal/review/sales.
Gate G7: partner course review/sale journey.

## Cross-cutting QA
Q1 real persistence
Q2 server authorization
Q3 tenant isolation via API
Q4 loading/empty/error/forbidden/not-found/offline/unsaved/partial-failure states as applicable
Q5 Arabic RTL + mobile
Q6 audit sensitive actions
Q7 browser journey tests
Q8 security gate
Q9 human approval
Q10 release candidate

## Deferred
Advanced skills/gaps/recommendations/readiness; deep Hirely integration; mobile app; advanced partner marketplace; automated settlements.

## Human Decision Gates
Only stop for unresolved source conflicts or product policy: backend final technology if needed; content-manager role mapping; FI access to private company content; organization lifecycle states; operating policies (revenue share, seat withdrawal after learning starts, refunds, default passing/renewal rules). Do not invent them.
