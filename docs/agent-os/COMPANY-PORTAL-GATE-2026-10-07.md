# Company Portal Gate — 7 Oct 2026

Status: CODE INTEGRATION READY / LIVE SUPABASE RETEST PENDING  
Release: BLOCKED — No Deploy Until MVP Gate.

## What is now wired in the repository

- All `/business/*` pages are guarded by authenticated company context before company content is shown.
- CO / BM / SA are the only roles allowed into Company Admin Workspace.
- Selected organization context persists across company navigation.
- Tenant/company name is resolved from the authenticated membership context instead of the old "شركة نموذجية" shell label.
- Supported live slices fail closed: if real RPC data cannot load, illustrative data is not presented as current.
- Dashboard live slice uses `company_training_dashboard`.
- Employees live slice uses `company_member_directory`.
- Reports live slice uses `company_training_report`.
- Certificates live slice uses `company_certificate_ledger`.
- Assignment live slice uses membership IDs and `assign_company_course`.
- Live assignment is restricted in UI to the approved reference course `customer-service-reference` v1 until broader catalog persistence is ready.
- Team-wide assignment remains disabled in live mode until branch/department team directory data is bound.
- Courses/seats, orders/invoices and most settings remain explicit preview/partial slices; they are not presented as live data.

## Company backend proposal

`supabase/proposals/company_portal_mvp.sql`:

- reuses unified `learning_enrollments`; it does not revive deprecated `learning_assignments`.
- company reports include only `context_type='organization'` + `source='organization'`.
- CO is organization scoped.
- BM is branch/department scoped.
- SA may support across organizations.
- assignment target is membership ID, never caller-supplied user ID.
- retries are idempotent for enrollment + assignment notification.
- server rejects a course/version not present in `course_activities`.
- certificate ledger returns learner display name but remains organization-context only.
- no broad INSERT/UPDATE/DELETE grants are added for browser roles.

## Verified before this code-integration round

Rolled-back Supabase rehearsal passed for:
- CO current-company context.
- cross-tenant company context denial.
- cross-tenant assignment denial.
- BM out-of-scope denial and in-branch allowance.
- duplicate assignment notification prevention.
- personal learning excluded from company report.
- organization certificate visible to company ledger.
- cleanup verified after rollback.

That rehearsal preceded the latest server-side course validation and certificate display-name additions. Those changes require one focused Supabase rehearsal before the RPC proposal can be considered ready for migration.

## Regression coverage added

- `tests/company-portal-contract.test.mjs`
- `tests/company-data.test.mjs`
- `tests/company-live-ui.test.mjs`

Coverage locks:
- unified learner model usage;
- personal/company separation;
- CO/BM scope contract;
- membership-ID mutation contract;
- server-side course validation;
- idempotent notification behavior;
- live company hydration;
- fail-closed UI state;
- company runtime bundles.

## Remaining Company Portal Gate work

1. Supabase rehearsal of the latest `company_portal_mvp.sql` together with unified learner + course engine proposals.
2. Verify reference course assignment succeeds and unknown course slug fails.
3. Verify certificate ledger returns display name without exposing personal learning.
4. Only after rehearsal PASS: decide whether to promote reviewed proposals into migrations.
5. Apply/migrate only under explicit authorization.
6. Live HTTP/browser checks for CO and BM on dashboard, employees, assignment and reports.
7. Phone QA for D1–D6.
8. Commerce gate remains separate: seats, purchases, orders/invoices, refunds and seat-withdrawal policy are not part of this gate.

## Spending / execution rule

No paid/additional-credit tool, external API/service, deployment, migration or production operation may be started without task-specific explicit permission from Saud. Previous approvals or "تابع" do not authorize new spend.
