# Database integration evidence — 17 October 2026

Passed for Excel v1 and Power BI v1 through real RPCs with authenticated SQL role/identity contexts, inside BEGIN/ROLLBACK.

| Step | Result |
|---|---|
| Prepare-to-activation of exact reviewed release | Pass, rollback only |
| Free order and learner enrollment | Pass |
| Owned exact-course runtime | Pass |
| Required content progress | Pass |
| Structured synthetic project evidence | Pass |
| Assessment while project pending | Correctly rejected |
| SA detail RPC and human-review action | Pass |
| Official assessment after approval | Pass, fixture answers 100% |
| Post-course skill measurements | Eight per course |
| Certificate issue-time name/title | Pass |
| Anonymous minimal certificate verification | Valid |
| Independent post-rollback cleanup | Zero bindings/enrollments; courses unpublished/unready |

Initial test used admin direct table read and encountered RLS isolation; corrected to the admin review-detail RPC used by the UI. No permission broadening.

Not covered: real learner files or application calculations, Storage HTTP upload/download, browser session flows, responsive/visual QA, public deployment. Synthetic answers and review are fixtures, not real course certification.
