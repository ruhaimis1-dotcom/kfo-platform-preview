# KFO Data Model & RBAC Contract

Status: reconciled with approved architecture v1.1 and 20 Sep checkpoint.

## Tenancy and membership
User identity is distinct from organization membership. Membership scopes organization, branch and department and carries role(s). One user may belong to multiple organizations with different permissions. Tenant isolation must be enforced in API/services/database/storage and tested via API.

## Roles
SA platform admin; CO company admin; BM branch/department manager; EM employee; IN trainer; TC training center; CQ quality reviewer; PA partner admin; FI finance admin; SU individual user.
Do not collapse these into only admin/company/trainee.

## Core entities
Identity/access: users, profiles, organizations, branches, departments, memberships, invitations, roles/permissions, audit events.
Catalogue/content: courses, course_versions, lessons, assets, paths, path_courses, partner ownership/review metadata.
Commerce: carts/orders/order_items, payments, refunds, gifts, seat_purchases/seat_pools, entitlements/enrolments.
Learning: learning_progress, lesson_progress/checkpoints, resume_positions.
Assessment: assessments, questions/question_banks, attempts, answers, grading/reviews, results.
Certificates: certificates bound to course_version, verification identifiers/read model, expiry/revocation/correction records.
Company: assignments, private_content, company paths/basic customization, renewals.
Partner: partner profiles, agreements, applications/reviews, sales/settlement records as allowed by phase.
Notifications/reporting: notifications and derived organization-scoped reporting views.

## Non-negotiable invariants
1. Company data is isolated; company reports exclude personal learning.
2. Stopping membership or withdrawing a seat does not delete learning/certificate history.
3. Learning/certificate records bind to a specific course version.
4. Paid entitlement is activated only after confirmed payment; pending verification is a distinct state.
5. Payment references are unique and post-payment enrolment failure is recoverable/auditable.
6. Assessment timing, attempts, pass score and completion rules are configuration, not hard-coded global defaults.
7. Manual grading does not publish a final result before review.
8. Certificate issuance validates eligibility server-side.
9. Public verification exposes only approved certificate facts; never email, phone or score.
10. Sensitive actions are audited with actor, time and before/after values where applicable.

## Baseline states from approved sources
Membership must support active/inactive history without destructive deletion.
Learning access/entitlement state is separate from progress.
Assessment attempt must distinguish in-progress/submitted/review-required/finalized as required by assessment type.
Certificate retains issued/expired/revoked history.
Payment must distinguish pending verification from failed.
Exact organization lifecycle states remain a Human Decision Gate because source documents conflict.

## First foundation exit tests
- create company
- add branch and department
- invite and accept employee
- employee blocked from company settings
- isolate two companies
- scope BM to branch/department
- multi-membership user with different permissions
- audit actor/time/before/after
- verify isolation via API, not UI only

Bulk import follows successful individual invitation flow.
