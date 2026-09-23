# KFO Master Spec & Architecture Contract

Status: Architecture baseline for Agent OS
Source branch: main
Rule: approved product architecture and visual identity are locked inputs. Changes to product scope, roles, journeys, or brand require a Human Decision Gate.

## 1. Product purpose
KFO is a corporate training tracking platform that connects organizational training needs, learner journeys, assessments, certificates, verification, and reporting.

## 2. Product surfaces
### Public
- Home
- Training/course catalogue
- About KFO
- Contact/demo request
- Login
- Public certificate verification

### Company workspace
- Dashboard
- Trainees/employees
- Training paths / assignments
- Progress tracking
- Certificates
- Reports
- Settings

### Trainee workspace
- Dashboard
- My courses
- Course/training experience
- Assessment
- Result
- My certificates
- My requests
- Account settings

### KFO administration
- Companies
- Users
- Training catalogue/content
- Enrollments/assignments
- Assessments
- Certificates
- Reports
- Platform settings and permissions

## 3. Core domain model
- Organization
- User
- OrganizationMembership
- Role / Permission
- Course
- LearningPath
- LearningPathCourse
- Enrollment / Assignment
- CourseProgress
- Assessment
- Question
- AssessmentAttempt
- Answer
- Result
- Certificate
- CertificateVerification
- TrainingRequest
- AuditEvent

All tenant-owned records must be scoped by organization_id where applicable.

## 4. Roles baseline
- KFO_ADMIN: platform-wide administration.
- COMPANY_ADMIN: manages its organization, trainees, assignments and reports.
- TRAINEE: accesses only assigned learning, own progress, assessments, results, certificates, requests and profile.

Fine-grained permissions are implemented behind these roles; no cross-company access is allowed.

## 5. Training lifecycle
Draft course/path -> publish -> assign/enroll -> learner starts -> progress saved -> requirements completed -> assessment attempt (when required) -> result calculated -> pass/fail -> certificate eligibility -> certificate issued -> public verification.

## 6. Assessment contract
Approved assessment UI includes:
- question
- question map/navigation
- timer when configured
- saved answers

Attempt state must be server-authoritative. Result issuance must not rely on client-side values.

## 7. Result contract
Approved result UI includes:
- score
- pass/fail state
- certificate action only after eligibility requirements are satisfied

## 8. Certificate & verification contract
- Certificates are issued only after eligibility.
- Each certificate has a non-guessable public verification identifier.
- Verification exposes only approved certificate facts, not private trainee/company data.
- Revoked certificates must return a revoked state.
- Issuance/revocation must be auditable.

## 9. Reporting baseline
Company reports derive from real organization-scoped records:
- active trainees
- completion
- issued certificates
- learning/training progress
- assessment outcomes
- readiness/impact metrics only when their calculation is explicitly defined

Prototype numbers are placeholders and are not production data.

## 10. Identity & UX lock
Current approved baseline tokens carried from the preview:
- Forest Ink: #04180F
- Signal Green: #419B2A
- Arabic typeface baseline: IBM Plex Sans Arabic
- RTL-first Arabic experience
- responsive layouts

The approved KFO logo and approved page architecture are locked. Preview assets are references; they must not override approved architecture.

## 11. Application architecture target
The current repository is a static prototype. Production implementation must separate:
- presentation/UI
- authentication/session
- authorization/RBAC
- domain services
- persistence/database
- reporting queries
- audit/security controls

No production business rule may exist only in browser JavaScript.

## 12. Data & authorization invariants
- Organization isolation is mandatory.
- Every privileged mutation is authorized server-side.
- Assessment scores/results are server-calculated.
- Certificate eligibility is server-validated.
- Public verification uses a dedicated safe read model.
- Sensitive operations generate audit events.

## 13. MVP release gates
1. Architecture gate
2. Data model + RBAC gate
3. Application shell
4. Authentication
5. Company workspace
6. Trainee workspace
7. Training/course engine
8. Assessment + result engine
9. Certificate issuance + public verification
10. Reporting
11. Automated QA
12. Browser/responsive QA
13. Security/tenant-isolation checks
14. Human approval
15. Release candidate

## 14. Explicit non-source-of-truth items
- Static preview metrics and sample names
- Client-side mock login
- Preview-only navigation behavior
- Any page/content that conflicts with later approved architecture

## 15. Human Decision Gates
Escalate only when a decision changes product behavior or commercial policy, including:
- new user role
- changed training/certificate eligibility policy
- changed tenant/data visibility
- changed approved architecture
- changed visual identity
- new integration with material scope/security implications

Implementation details that preserve this contract do not require repeated human approval.
