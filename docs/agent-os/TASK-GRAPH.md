# KFO Agent OS Task Graph

## Authority
Approved Checkpoint 20 Sep 2026 is the current source of truth. Do not rediscover product, rename approved routes, change identity, or auto-publish.

## Completed gates
A0 repository audit: static preview identified.
A1 checkpoint reconciliation: approved 16 learner/public previews + architecture v1.1 + visual identity ingested.
A2 Master Spec reconciled.
A3 Data/RBAC contract reconciled.

## Design continuation — exact current checkpoint
D0 Company Training Dashboard visual review/preview [NEXT]
D1 Employees & Teams
D2 Courses & Seats
D3 Training Assignment
D4 Reports & Certificates
D5 Orders & Invoices
D6 Company Settings
Design pages must follow approved KFO identity. Each internal page must be reviewed; sidebar links alone are not completion.

## Implementation DAG
B0 Source inventory/mapping: map every repo/source artifact to domain/page/API/entity/test and classify matching/partial/missing/uninspected.
B1 Foundation app architecture and chosen stack [blocked by Human Decision Gate only if final backend choice materially differs from available source].
B2 Identity/auth/profile/use-type flow.
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
