# KFO pilot readiness — 2026-10-17

Source audit of recovery branch; not browser acceptance or release approval.

## Planning estimate

Approximately **65% overall completion** (weighted source-readiness assessment 64/100, rounded). This is a planning judgement, not measured production readiness or a committed delivery date. No prior percentage baseline is implied.

| Workstream | Weight | Assessed completed | Main gap |
|---|---:|---:|---|
| Access and recovery | 10 | 8 | Latest-build browser recheck; owner onboarding limited to confirmed accounts |
| Learner workspace and certificates | 20 | 15 | Fixed holder name, public verification, final visual certificate QA |
| Course engine and five-course launch content | 20 | 14 | Content approval/catalog consolidation, real application exercises, activation after approval |
| Company operations | 20 | 12 | Real invitation flow, all-course library/assignment, report export, global branding |
| Platform administration | 15 | 12 | Full browser role/action QA; reviewed activation operator workflow |
| Release acceptance and operations | 15 | 3 | Current-source preview, cross-role journeys/mobile QA, security follow-up, human release gate |
| Total | 100 | 64 | Not approved for pilot release |

## Routes and work remaining

| Route or section | Existing implementation | Remaining work |
|---|---|---|
| `/` | Home source and brand assets | Latest visual/link/mobile acceptance |
| `/catalog` and 3 public course pages | Free self-study lessons and formative checks | Unify catalog with Excel/Power BI; distinguish public practice from enrolled certification |
| `/login`, `/forgot-password`, `/reset-password` | Auth/recovery source, earlier login/recovery evidence | Recheck current build and email journeys |
| `/workspace#overview` | Learner metrics and company context | Current-build browser acceptance |
| `/workspace#courses` | Personal/org enrollment cards and exact-version links | End-to-end activation/enrollment/player acceptance |
| `/workspace#notifications` | Own notifications and mark-read | Browser action/error/race acceptance |
| `/workspace#profile` | Edit learner name/headline | Browser save/restore acceptance |
| `/workspace#certificates` | Owned-chain validation and printable HTML completion record | Immutable holder identity, public verification, final visual/print QA |
| `/learn` | Activities/evidence/assessment, release preview and enrollment runtime loader | Review/activate launch releases; actual file/evidence/review/assessment journey |
| `/orders` | Personal free enrollment and paid-awaiting-payment boundary | Real browser free/paid retry checks; Neoleap intentionally pending |
| `/business/dashboard` | Live scoped aggregates | Remaining placeholder sections and latest-browser acceptance |
| `/business/employees` | Scoped member list | Invite dialog currently preview; actual invite/accept journey |
| `/business/courses` | Reference-course summary | Published multi-course library |
| `/business/assignments` | Live member assignment to reference course | Course selection across activated releases; team grouping currently disabled |
| `/business/reports` | Live scoped progress/certificates | Report export and browser acceptance |
| `/business/orders` | Company order/free/paid boundary | Browser acceptance; no purchased-seat ledger or tax invoicing |
| `/business/settings` | Text/colors/images/structure/roles/notifications/audit | Apply branding globally, training policy, real storage upload QA |
| `/company/settings` | Company name change | Browser acceptance |
| `/admin/dashboard` | Live overview | Cross-role browser QA |
| `/admin/organizations` | Directory/create company with existing confirmed owner | Onboarding new owner and tenant hosting/domain activation |
| `/admin/users` | Scoped admin membership directory | Full role/browser acceptance |
| `/admin/content` | Metadata/lesson/design authoring and release preview | Content review, activation operator handoff and browser QA |
| `/admin/reviews` | Evidence inspection/file access/human review | Actual upload-to-review-to-completion browser journey |
| `/admin/certificates` | Admin certificate directory | Certificate finalization/verification workflow |
| `/admin/activity` | Audit directory | Browser acceptance |
| Public certificate verification | No current enrolled-certificate public route | Build minimal-status lookup without exposing personal data by default |

Learner hash sections are five sections of a single workspace route, not five independent backend pages. QA/review-only pages are excluded from the pilot product inventory.

## This round
- Corrected Arabic titles and exact-version enrollment launch links for Excel/Power BI. Links do not publish courses or bypass server authorization.
- Build and 305 local tests pass. No current-source real browser verification, deployment or persistent course activation.
- Existing security advisor warnings remain (including leaked-password protection); they are not cleared by local tests.

## Release sequence
1. Complete remaining company/certificate workflows and reconcile the five launch courses.
2. Review course/visual content; prepare an approved current-source preview channel.
3. Test learner, company owner/manager and platform admin journeys, payment boundary, isolation, uploads and mobile layouts.
4. Present concrete acceptance results for the human MVP/release gate; then activate approved courses and publish only with explicit approval.
