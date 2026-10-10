# KFO private evidence QA — 2026-10-10

## Outcome

Applied Supabase migration `20261010110658_private_evidence_storage_gate` to KFO project `ktkdcfxeaicbykdurlfg`. The bucket is private, limited to 10 MiB and PDF/XLSX/CSV/PNG/JPEG. Server-side upload preparation, object verification, pending submission and idempotent finalization are enforced. Generic file submissions and the legacy finalizer cannot bypass object verification. Submitted objects cannot be overwritten or deleted through the added policies.

The player now uploads the selected File before finalization, prevents concurrent submissions, handles errors and attempts cleanup of unfinalized objects. UI code remains on the local QA branch; no push, merge or deployment was performed.

## Verification

- Build passed. All 15 focused runtime/evidence/file tests passed, including six new behavioral upload tests with a mocked storage client.
- Authenticated SQL tests passed for owned paths, foreign path rejection, missing object rejection through both finalizers, generic file bypass rejection, size/MIME limits, metadata size mismatch, pending submission and idempotent retry with one evidence row.
- Storage RLS denied a branch manager access to personal evidence and allowed the platform administrator.
- Review RBAC cases covered company scope, branch scope, personal evidence, cross-tenant denial, employee denial, reviewer identity, rubric/course validation and review status validation.
- Department scope denied the branch manager in another department and allowed a matching department, for both review authorization helpers and review submission.
- Required pending evidence blocked the official assessment. After authorized review passed, the server recorded completion and one certificate. A repeat submission was denied after completion.
- All database fixtures used transactions with rollback. Final counts: zero enrollments, evidence, certificates, QA activities or evidence storage objects; original five membership roles remained.

These storage database checks used object metadata fixtures, not an actual HTTP byte upload. The new browser upload flow has behavioral unit coverage; a signed-in browser end-to-end upload is still required. The reference course has no file-evidence activity; the synthetic activity used for QA was rolled back.

## Remaining gate items

The full check has 192 tests: 183 pass, nine fail. The same nine failures existed before this change (baseline 186: 177 pass, nine fail). They concern outdated source assertions in admin/company/player/workspace/copy/gate tests; they have not been changed or suppressed. Reconcile them against the approved product behavior before declaring the full gate green.

Supabase advisors reported no ERROR. Existing warnings include authenticated SECURITY DEFINER RPC exposure and disabled leaked-password protection; no authentication settings were changed in this repair.

Still required: signed-in browser upload/error/review verification using a approved file-evidence activity; rubric version-specific rejection case; company/branch reviewer file access checks against actual stored bytes; final MVP gate review before deployment.

## Local regression follow-up — 2026-10-10

The nine baseline test failures are now resolved. `npm run check` passed the build and **197/197 tests**, with zero failures. No application behavior or database settings were changed in this follow-up.

- Replaced obsolete admin guard string checks with controller execution verifying CO/BM/EM/FI/SU denial, inaccessible SA denial, accessible SA admission, signed-out routing and failure to verify access.
- Executed workspace routing for CO/BM, SA precedence, multiple company selection, mixed company/learner context and inaccessible memberships. Verified technical membership cards remain hidden for active learners and appear for the invitation fallback.
- Executed player submission behavior for text and files: pending evidence remains incomplete and blocks the next activity; submission errors never claim success; concurrent clicks submit once; public evidence cannot persist.
- Updated the employee scope copy expectation and checked homepage metrics against rendered text rather than CSS layout values.
- Replaced the outdated blanket migration prohibition with the recorded integration migration scope and explicit production deployment block. Build/check remain local operations.

Controller tests use a minimal simulated DOM and mocked service boundaries. They are not signed-in browser, HTTP upload, responsive layout or visual acceptance tests. The remaining gate items above still apply. No remote push, merge or deployment was performed.

## Signed-in browser round — 2026-10-10

User authorized a bounded Work browser round without deployment or service upgrades. Verified the existing Vercel Preview deployment for commit `8735c377ae4228874fb8762c1e004a8bc9ec25f1`: `https://kfo-platform-preview-543j48e9r-zawed1.vercel.app/`. This preview predates the private file UI repair. The cloud browser could not connect to the local HTTP server; the server was stopped. No new preview was published.

Browser results using Saud's actual account:

- Login succeeded and routed to SA Admin Workspace. All seven admin pages loaded their live payloads: overview, organizations, memberships/roles, content, certificates, review queue and audit log.
- Hirely company dashboard, scoped member directory, reports/certificate ledger and assignment form loaded. Search with an unmatched name displayed the empty state. The assignment form disallowed submission with no selected member and disabled whole-team assignment. No assignment, profile or evidence mutation was submitted.
- The public catalog displayed three free courses with images. The customer-service course rendered its four lessons, activities and self-review with a clear statement that public self-review does not issue certificates or persist completion. Self-review answers were not submitted in this round.
- A subsequent secure login returned to Saud's SA account. The later manual sign-in established the EM session described below. BM browser denial and the enrolled learning journey remain unverified. No secrets were read, recorded or included in this report.

Browser defects found and corrected locally:

- Member list was live but overview/footnote still claimed 128 employees and six teams/invitations. Hydration now uses active membership count from its scoped payload and shows unavailable counts as pending, without invented zeroes.
- Dashboard assignment panel retained a sample four-row label. It now uses the live assignment total.
- Report completion caption retained the 96-assignment denominator and the certificate badge retained three sample certificates. Both now follow live totals, including empty states. Accessible metric labels and scope notes also reflect live mode.

Added three controller regression tests for these defects. Build and full regression now pass **200/200**. Corrections remain local and therefore have not been rechecked in the hosted browser. No merge, push, migration or deployment occurred in this browser round.

Additional MVP observations: admin membership/audit pages display UUIDs and internal English status/action labels; empty admin certificate/review tables have no explicit empty-state row. Employee profiles are absent, so member names fall back to the generic company-member label. Several company commerce/settings areas remain previews, and review UI is read-only. These are not certified as completed user journeys by this browser round.

## EM browser continuation — 2026-10-10

Manual sign-in confirmed `ruhaimi.s1@gmail.com` as the EM learner. Workspace loaded the active Hirely membership, zero enrollments/certificates and explicit course, notification and certificate empty states. Refresh preserved the signed-in identity and loaded the workspace again. Profile was left unchanged.

The Hirely company dashboard refused EM access and displayed only its denial state. The admin dashboard also refused permission and did not load live admin data, but its static shell remained visible above the denial message, including a misleading SA label. Therefore admin visual denial failed in the hosted preview; this is not a full browser PASS. The author stylesheet's grid display overrode the native hidden attribute.

Added `.admin-shell[hidden]{display:none!important}` locally and regression checks for denial setting the hidden attribute and the stylesheet preserving it. Build and **201/201 tests passed**. The stylesheet assertion and simulated DOM checks do not replace browser visual verification. The hosted preview still runs the older commit; no push or deployment was performed.

The public `/learn` player loaded all eight reference activities. Completing the first scenario displayed 13% and explicitly stated that public progress was not saved. Refresh reset the player to the first activity and 0%. Returning via Save and Exit kept the workspace at zero enrolled courses and certificates. No persistent learning record was created by this public interaction.

The EM account has no enrolled course, so official assessment, certificate issuance and private evidence upload/review cannot be verified end to end through this browser session. Remaining gates include an enrolled QA journey on the corrected build, real byte upload and authorized reviewer read checks, rubric version rejection and BM browser denial. The workspace tab was retained for continuation.

## Local review actions follow-up — 2026-10-10

Prepared an SA review workflow locally: open an evidence item, render the submitted response as plain text, inspect course-version rubrics, download an attached file through authenticated private Storage, and submit a grade/decision/feedback. Required corrective feedback, bounded grades, matching rubric IDs, explicit server confirmation and a concurrent-submit guard are implemented. Empty queues display an explicit state. Errors preserve the response and form without claiming success.

Prepared learner feedback loading and plain-text display in the course coach. Feedback attaches only to the exact evidence ID and never changes a pending/revision result into completion. A feedback loading failure is explicit rather than silently dropping corrective guidance.

New SQL proposal: `supabase/proposals/admin_evidence_review_actions.sql`. It contains two narrow SA RPCs and an owned-enrollment learner feedback RPC. Reads require active pending evidence; the write locks the evidence, checks expected submission timestamp, rejects superseded/already-reviewed submissions, validates grades and corrective feedback, then calls the existing server review function. No reviewer role or broad table grants are added. Existing CO/BM review RPC behavior is unchanged; no CO/BM review UI was added in this follow-up.

**This proposal is not applied and has not been executed against PostgreSQL.** There is no PostgreSQL or Docker runtime available in this scratch environment. No remote query, migration, push, deployment or new paid service was started in this follow-up. The review UI depends on these new RPCs and is not ready to deploy independently of the proposal. No visual/browser PASS is claimed for this local change.

Build and **212/212 tests passed**, including data-boundary, authenticated download, invalid input, server-confirmation, concurrent-submit, failed-save retention, empty-state and learner feedback rendering cases. Tests use mocked service responses and the existing minimal DOM; they do not prove database authorization or actual HTTP byte access.

Next concrete verification round: execute/review the proposal in KFO with rollback test fixtures; verify SA allow and EM/CO/BM denial for the new admin-only RPCs, learner ownership and rubric-version mismatch, superseded/duplicate review rejection; make the corrected build available for browser QA under explicit test-preview authorization; use a clearly designated disposable enrolled fixture for the full learner journey and actual file upload/reviewer download. Production remains gated on this evidence and Saud's release approval.

## Approved integration and test-preview round — 2026-10-10

Saud explicitly approved one bounded round: apply the review integration after checking it, publish a test preview and verify an enrolled learning/file journey. No service upgrade or production release is authorized.

Applied `20261010141125_admin_evidence_review_actions` atomically with rollback assertions. The assertions exercised authenticated database roles, not mocked RPC responses: SA detail/save; anonymous/EM/BM/CO-only denial; exact course-version rubric filtering and wrong-version rejection; null/NaN/out-of-range grade rejection; missing corrective feedback; stale timestamp; duplicate/superseded submission rejection; reviewer identity derived server-side; learner-only feedback reads. All fixtures, including the temporary removal of SA to test CO-only access, were rolled back. Post-application verification: 3 RPCs present, zero enrollments/evidence/reviews/certificates/QA rubrics, original 5 roles.

Security advisors returned no ERROR. The three intentionally scoped SECURITY DEFINER RPCs add three expected warnings (25 such notices total); leaked-password protection warning remains unchanged. Raw evidence_reviews stays closed behind RLS without a SELECT policy. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable .

Added an isolated noindex `/qa/files` player fixture for real-byte upload verification. It uses `qa-private-file-20261010`, not the customer-service course, and the same enrollment ownership/runtime/upload implementation. The normal `/learn` reference course is unchanged. No QA course appears in the free-course catalog. QA enrollments/activities/files must be cleaned after the browser round.

Build and **214/214 tests passed** before publishing the test-preview source. Database integration is verified; browser review, real byte upload and full enrolled certificate journey are still pending at this checkpoint.

### Test preview push blocked by automatic approval review

Source checkpoint: `bd5f82f60a6763e805c64fe4c4a1832623059c0d`; intended destination is the existing KFO repository `ruhaimis1-dotcom/kfo-platform-preview`, dedicated new branch `qa/kfo-uat-20261010`. The attempted remote push was rejected by automatic approval review: approval covered a test preview in substance but did not explicitly name this repository destination and remote-push side effect, which may trigger Vercel deployment. No workaround or retry was attempted. This requires explicit destination/remote-push authorization before continuing.

No persistent browser QA enrollments or file activities have been inserted in this round: preparation of those fixtures did not run after the rejection. Database counts remain at the verified zero-test-data checkpoint above. Full enrolled browser journey, actual byte upload and new-build visual verification are blocked on the corrected preview. Production release remains unauthorized.
