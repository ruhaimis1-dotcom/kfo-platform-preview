# KFO Data Model & RBAC Contract

## Tenant boundary
Organization is the primary business tenant. Tenant-owned data must carry organization_id directly or inherit it through a relationship that can be enforced in database authorization.

## Core entities
| Entity | Purpose | Tenant scoped |
|---|---|---|
| organizations | Company/customer account | root |
| users | Auth identity/profile reference | global identity |
| organization_memberships | User membership and role in a company | yes |
| courses | Training content metadata | platform or tenant depending ownership |
| learning_paths | Ordered training programs | yes/platform |
| learning_path_courses | Path composition | inherited |
| enrollments | Course/path assignment to trainee | yes |
| course_progress | Learner progress | yes |
| assessments | Assessment definition | inherited |
| questions | Assessment questions/options | inherited |
| assessment_attempts | Server-authoritative attempt | yes |
| answers | Saved answers | inherited |
| results | Score/pass-fail result | yes |
| certificates | Issued certificate record | yes |
| certificate_verifications | Public-safe verification projection/token | linked |
| training_requests | Trainee/company training request workflow | yes |
| audit_events | Sensitive action trail | yes/platform |

## RBAC
### KFO_ADMIN
Platform-wide administrative access, subject to audit.

### COMPANY_ADMIN
Within own organization:
- read/update organization settings
- manage organization members/trainees
- assign training
- view organization progress/results/certificates/reports
- cannot access another organization

### TRAINEE
Within own identity and organization:
- read assigned courses/paths
- update own permitted progress
- create/save own assessment answers through domain rules
- read own results/certificates
- create/read own requests
- update own permitted profile settings
- cannot self-assign privileged roles or alter authoritative results

## Security invariants
1. UI hiding is never authorization.
2. Server/database policies enforce tenant and ownership boundaries.
3. Assessment attempt state, timing, scoring and finalization are authoritative server-side.
4. Certificate issuance/revocation requires privileged domain authorization.
5. Public certificate verification cannot expose private account data.
6. Cross-tenant queries must fail closed.
7. Audit records are append-oriented and protected from ordinary tenant mutation.

## State baselines
Enrollment: assigned -> in_progress -> completed (or cancelled where supported)
Assessment attempt: created -> in_progress -> submitted -> graded
Result: pending -> passed | failed
Certificate: issued -> revoked
Training request: submitted -> under_review -> approved | rejected | cancelled

Any additional state that changes business policy requires a Human Decision Gate.
