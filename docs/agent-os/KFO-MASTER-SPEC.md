# KFO Master Spec & Architecture Contract

Status: reconciled with KFO Approved Checkpoint — 20 Sep 2026.
Authority order: current approved checkpoint > architecture/page-structure v1.1 > earlier source documents > preview repository.
Rule: do not rediscover the product, change identity, rename approved routes, or publish automatically.

## Product
KFO is a training, employee-development and certificate platform for individuals, companies and training partners. Domains include identity/access, organizations, catalogue/content, commerce, learning, assessment, certificates, company development, partners, reporting, notifications and integrations.

## Approved visual checkpoint
Sixteen desktop previews are approved: public home/hero; catalogue; course details; purchase/enrolment completion; enrolment confirmation; learner dashboard; course/player; lesson; assessment; result; certificate; public verification; My Courses; My Certificates; My Requests; Account Settings.
Preview data, prices, names, statistics and QR values are examples only.

Exact design stopping point: the four internal learner pages were approved. Company-page map was shown for the next phase, but company visual previews were not yet produced/approved.

## Locked identity
- Existing KFO logo: no redesign.
- Arabic: IBM Plex Sans Arabic. English/numbers: Inter. Ship actual font files at implementation.
- Forest Ink #04180F; Deep Teal #123B32; Operational Green #205E1E; Signal Green #419B2A; Soft Lime #88D768; Mist #F4F6F8; Sage Tint #E7EEE9.
- RTL first; WCAG AA; state meaning cannot rely on colour alone.
- Public home uses a full-width hero. Content pages use short introductions. User dashboards do not use marketing heroes.
- Home remains visible in navigation and logo links home.

## Approved route architecture — do not rename
Public/account: /, /catalog, /catalog/[course-slug], /paths, /paths/[path-slug], /partners, /partners/[partner-slug], /verify-certificate, /about, /contact, /login, /register, /forgot-password, /profile, /settings, /notifications, /orders, /orders/[id], /gifts.
Learner entry: /learn/dashboard.
Company entry: /business/dashboard.
Partner entry: /partner/dashboard.
Administration entry: /admin/dashboard.
Detailed route maps remain governed by KFO-Architecture-and-Page-Structure-v1.1.

## Roles
SA platform admin; CO company admin; BM branch/department manager; EM employee; IN trainer; TC training center; CQ quality reviewer; PA partner admin; FI finance admin; SU individual user.
Membership is independent of user identity and scopes organization/branch/department. A role never grants access outside its scope. Multi-organization membership with different permissions must be supported and tested.

## Multi-tenant invariant
Isolation across companies applies in API, services, database and storage. Company reports exclude employees' personal learning. Private resources carry company scope. Access to assets is authorized.

## Commerce/access rules
- No paid access before confirmed payment.
- payment-verification pending is not failure and must not trigger duplicate payment.
- Free learning has no payment fields.
- Existing active entitlement starts/continues learning without repurchase.
- Gifts and team seats use their appropriate flows; company purchasing requires authorized user.
- Payment references are unique; amounts use integer minor units; post-payment enrolment failure must be traceable/recoverable.
- My Requests covers personal purchases and gifts.

## Learning rules
- My Courses includes personal, free and company-assigned learning.
- Learning progress is independent from entitlement/access lifetime; withdrawing membership/seat does not erase history.
- Next does not automatically complete a lesson.
- Save resume position and handle save failures.
- Lesson order, assessment requirements, passing score, attempts and time are per-course/per-assessment settings.
- Learning and certificates bind to a specific course version.

## Assessment/result rules
Approved assessment UI: question, question map, timer where configured, saved answers.
Manual grading does not expose a final result before review.
Approved result UI: score and pass state, with certificate action only when requirements are satisfied.

## Certificates/verification
- Issue only after requirements are satisfied.
- Expired/revoked certificates remain in history and verification reflects actual state.
- Public verification must not expose email, phone or score.
- Issuer must be factual; no undocumented accreditation logos/claims.
- Name changes affect future certificates; issued certificates require a separate correction request.

## Company design phase — next exact sequence
1. Training dashboard
2. Employees & teams
3. Courses & seats
4. Training assignment
5. Reports & certificates
6. Orders & invoices
7. Company settings

Training dashboard: employee/assignment/seat indicators; Add Employee, Assign Course, Buy Seats actions; progress/deadline/status table; alerts and reports.
Training assignment flow: course -> employees/department -> deadline -> seat review -> confirm.

## Full implementation sequence
Shared foundation -> catalogue/content -> commerce/seats -> reliable learning -> certificates -> company/reporting -> partners.
Deferred: advanced skills/gaps/recommendations/readiness, deep Hirely integration, mobile app, advanced partner marketplace, automated settlements.

## Quality definition
A page is not done because it renders. It must be role-visible correctly, backend-authorized, persist real data, and handle loading, empty, error, forbidden, not-found, offline/connection, unsaved-change and partial-failure states as applicable; support Arabic/mobile; audit sensitive actions.

## MVP acceptance journey
Company -> employee -> buy seats -> assign -> employee login -> learning/checkpoints -> final assessment -> certificate -> result/notification in company dashboard.

## Human Decision Gates still unresolved in source
Do not silently decide: final backend technology where source leaves PostgreSQL design vs Laravel/MySQL implementation open; content-manager role mapping; FI access to private company content; unified company lifecycle states; advanced path interpretation; operating policies such as revenue share, seat withdrawal after learning begins, refunds, passing/renewal defaults.
