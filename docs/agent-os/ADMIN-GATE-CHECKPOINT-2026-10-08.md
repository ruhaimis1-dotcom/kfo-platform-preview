# KFO Admin Gate — Checkpoint 2026-10-08

Status: ADMIN UI + SA GUARD + DATA ADAPTER READY / SUPABASE KFO CONTRACT TEST PENDING  
Production: BLOCKED.

## Completed on GitHub

- Added role-aware routing so SA goes to /admin/dashboard.
- Added SA-only admin guard using existing workspace/access context.
- Added Admin Workspace pages:
  - /admin/dashboard
  - /admin/organizations
  - /admin/users
  - /admin/content
  - /admin/certificates
  - /admin/reviews
  - /admin/activity
- Added shared admin visual system and mobile drawer.
- Added admin data adapter with narrow RPC names only.
- Added admin live controller with fail-closed behavior.
- No direct browser dependency on auth.users or service-role access.
- No fake operational numbers are shown as live data.
- Build pipeline now includes admin runtime/live bundles and all admin pages.
- Regression tests added for SA-only routing, RPC contract, and fail-closed behavior.

## Planned Admin RPC contract

Read-only MVP:
- admin_platform_overview
- admin_organization_directory
- admin_membership_directory
- admin_course_directory
- admin_certificate_directory
- admin_evidence_review_queue
- admin_audit_log

Mutation RPCs are intentionally deferred until each action has:
- explicit authorization rules;
- audit logging;
- rollback/rehearsal evidence;
- Human Gate where required.

## Current blocker

The active Supabase connector currently exposes project Glam only. KFO project ref
ktkdcfxeaicbykdurlfg is not available in the active connection.

Do not run Admin SQL against Glam.
Do not guess missing KFO table columns.
Reconnect Supabase KFO before building/testing/applying the Admin RPC proposal.

## Next step after reconnect

1. Inspect KFO live schema for organizations, memberships, roles, audit_events, course engine, certificates, evidence/reviews.
2. Draft exact Admin RPC SQL against actual columns.
3. Run Transaction/Rollback rehearsal as SA and non-SA.
4. Verify cross-tenant/platform scope.
5. Apply migration only after rehearsal PASS under the current Admin Gate authorization.
6. Re-run Security Advisors.
7. Admin Gate remains preview-only; no Vercel or Production in this round.


## Update — 8 Oct 2026

Supabase KFO reconnected and live schema inspected.

Applied migration:
- 20261008081615_admin_readonly_gate

Admin RPC rehearsal result:
- CO denied before temporary SA: PASS
- temporary SA inside Transaction/Rollback: PASS
- organizations visible: 2
- memberships/roles rows visible during rehearsal: 5 (includes the temporary SA role row inside the transaction)
- course versions visible: 1
- certificates: 0
- pending/revision evidence: 0
- audit rows: 18 during rehearsal
- persistent SA roles after rollback: 0

Security:
- no new RLS-disabled errors introduced by Admin Gate.
- public Admin RPCs are SECURITY DEFINER by design, but each requires auth.uid() and private.is_platform_admin().
- no permanent SA grant was created.
- no mutation RPCs were added.

Current blocking decision:
KFO has no persistent active SA assignment. Admin Workspace cannot be used until Saud explicitly approves which existing account should receive SA.
