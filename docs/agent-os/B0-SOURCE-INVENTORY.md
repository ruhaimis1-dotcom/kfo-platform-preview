# B0 — Source inventory and implementation boundary

Date: 28 Sep 2026. Authority: approved KFO checkpoint (20 Sep), then architecture v1.1 and the reconciled Master Spec/Data RBAC contract. This is a source inspection, not an operational certification.

## Sources inspected

| Source | Evidence | Scope |
| --- | --- | --- |
| Current `kfo-platform-preview` | `business/{dashboard,employees,courses,assignments,reports,orders,settings}.html`, `auth/*`, `package.json`, `docs/agent-os/*` | Approved static company D0–D6 previews; authentication prototype and validation tests. Other business cards use sample DOM data. |
| Approved checkpoint `KFO-Approved-Checkpoint-2026-09-20.zip` | `START-HERE`, architecture/identity records, 16 approved public/learner PNGs | Design/documentation authority, not an application or database. |
| Archived frontend `taa-frontend-main.zip` | `src/app/[locale]/business/*`, `src/features/business/*/api/*`, `src/features/auth/*`, `package.json` | An older ATHR/TAA Next.js 16 / React 19 / TypeScript application with company and instructor screens/API clients. Archive has no Git history. |
| Archived backend `taa-backend-new-main (1).zip` | `routes/api.php`, `routes/api/v1/auth/business/*`, `app/Models/*`, `database/migrations/*`, `tests/*` | An older Laravel 10 / MySQL / Sanctum API, with 86 migration files. Archive has no Git history. |

The archived source was inspected outside this repository; no archived code, dependencies, credentials or generated assets are being imported by this document. Filename and source presence do not establish production readiness.

## Domain map

Status vocabulary: **present** means a relevant source artifact exists; **partial** means it differs from the approved KFO contract or lacks an end-to-end proof; **missing** means no corresponding artifact was located in the inspected locations; **unverified** means runtime/data/security behavior has not been exercised. The current preview is a separate design surface.

| Contract area | Current preview | Archived frontend | Archived API/data | B0 assessment |
| --- | --- | --- | --- | --- |
| Identity, recovery, profiles | `auth/login.html`, `forgot-password.html`, `reset-password.html`, `auth.js`; Supabase email/password/recovery; five validation tests | `features/auth/api/auth.api.ts`, NextAuth/session/role code | `routes/api/v1/guest/general/auth.php`, `auth/general/auth.php`; Sanctum | **Partial.** Two incompatible session paths; approved role routing and shared user identity need one selected contract. |
| Company dashboard | `business/dashboard.html` approved D0, example figures | `app/[locale]/business/dashboard/page.tsx`, dashboard API clients | `auth/business/dashboard.php` | **Present, unverified.** Rebuild against real tenant-scoped aggregates. |
| Organization, branches, departments, members, invitations | `business/employees.html` approved D1 | `business/{members,branches,departments,join-requests}/*`, matching feature API clients | `auth/business/{employee,invites,employeeJoin,branch,department}.php`; `Company`, `Employee`, `Branch`, `Department`, `InviteMember` | **Partial.** Existing company relationship and scoped request rule (`ExistsEmployeeToBusiness`) offer reusable behavior. KFO requires explicit organization membership, multi-organization identity and tenant context. |
| Roles, scopes, audit | UI examples in employees/settings | `business/{roles,logs}/*`, permission helpers | `auth/business/{role,activitylog}.php`; `CheckPermission` middleware and activity log migration | **Partial.** Backend has permission checks and some employee-scope helpers. No API isolation suite, and legacy company-user implicit full access must be reconciled with KFO CO/BM/EM and branch/department scopes. |
| Catalogue, content, courses | `business/courses.html` approved D2 | `business/{shop,my-courses,create-course}/*`; course API clients | `auth/business/courses.php`, `Course` and related models | **Partial.** KFO course versions, partner ownership, private tenant content and publication gates need a contract gap review. |
| Commerce, seats, assignments | `business/{orders,assignments}.html` approved D5/D3 | `business/{cart,history,tasks}/*`, cart/order/task clients | `auth/business/{cart,order,tasks}.php`; `Order`, `Purchase`, `Seat`, `Enrollment`, relevant migrations | **Partial.** Source artifacts exist, but confirmed-payment entitlement, idempotency, seat withdrawal and full traceable purchase-to-assignment journey are unverified. |
| Learning, exams, certificates | No implemented learner journey in this repo; 16 approved public/learner images in checkpoint | `business/{my-courses,video,learning,exams,tested,exam-results}/*`; no corresponding App Router learner pages located | `auth/business/{exam,examResult}.php`; `CourseProgress`, `Enrollment`; no `Certificate` model or certificate-named migration located | **Partial / missing** for KFO learner, version-bound certificate and public verification journey. Do not infer completeness from backend routes or readme. |
| Reports, notifications, settings | `business/{reports,settings}.html` approved D4/D6 | `business/{dashboard,settings,logs}/*`, notification clients | `auth/business/{dashboard,notifications,setting,activitylog}.php` | **Partial.** Company-only reporting boundaries, certificates, invoices and controlled tenant branding need implementation/verification. |
| Partner, admin, tenant portal | No company portal host resolution | Instructor pages exist; no matching KFO partner/admin App Router journey located | `auth/instructor/*`, `auth/admin/*` | **Partial.** Older actor model is not the approved partner/SA/CQ/FI model. `{tenant}.kfo.sa`, custom-domain readiness and extraction seam were not found as tested capabilities. |

## Evidence and constraints

- The old business routes sit behind `auth:sanctum`, `checkUserType` and account approval in `routes/api.php`; individual controllers also use `checkPermission`. For example, `EmployeeController::list` passes `authBusinessCompanyId()`; `ShowEmployeeRequest` uses `ExistsEmployeeToBusiness`. These are useful patterns, **not** a proof that every route is tenant isolated.
- The old backend test directory contains only `Unit/ExampleTest.php` and `Feature/ExampleTest.php` plus bootstrap files. No domain/API isolation tests were located. No live backend, database, payment provider, email delivery or full browser journey was executed during B0.
- The preview's five authentication validation tests and build had passed in the prior inspection. They do not prove login routing, authorization or persistence for business pages.
- KFO identity is locked: existing logo, IBM Plex Sans Arabic and Inter with approved weights/colours, Arabic RTL and approved route names. The old frontend's font/branding/route choices cannot replace those decisions.
- Approved D0–D6 design is preserved. Phone QA for the whole company set remains open; the user confirmed the mobile settings navigation fix, which does not imply full mobile acceptance for all pages.

## B1 recommendation and decision boundary

Use the **existing Next.js frontend and Laravel API as a reference inventory**, including endpoint behavior and UI flows. Do not merge the archives into the static preview. First define one deployable auth/session boundary, a KFO organization/membership/role schema, tenant resolution from host, and a versioned API contract. Implement a narrow vertical slice: create organization → branch/department → invite and accept employee → tenant-scoped dashboard/member list. Add API tests for two organizations, cross-tenant denial, BM branch scope, multi-membership permissions, employee settings denial and audit events before expanding to commerce.

The final backend/database choice is an explicit architecture decision: the approved source contract leaves PostgreSQL open while archived implementation is Laravel/MySQL; the preview prototype uses Supabase Auth, while the archived pair uses NextAuth plus Laravel Sanctum. B0 cannot declare one of these stacks approved. B1 should compare (a) adapting Laravel/MySQL and replacing the prototype auth, versus (b) implementing the KFO data contract on PostgreSQL/Supabase with an integrated session strategy. Compare migration cost, tenant isolation, operational fit and testable first slice, then record the decision before persistent implementation. No production credentials or customer data are required for that decision.
