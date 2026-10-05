# KFO — End-of-Day Checkpoint — 2026-10-05

## Status
Work paused by owner. Resume from this checkpoint. No Deploy Until MVP Gate.

## Working branch
agent-os/kfo-learner-portal-mvp-20261005

## Latest completed slice
Intelligent Course Player UI + first KFO Reference Course.
Latest known commit at checkpoint: e8a5cce1e92e3f48beaebb7d4b352ec4860bde6d

## Locked product decisions
- One User / one Learner Profile.
- Learning context belongs to enrollment, never a fixed learner type.
- Personal learner and organization learner can coexist on the same account.
- Personal learning is private from employers unless separately assigned in organization context.
- Unified Progress / Assessment / Completion / Certificate / Notifications.
- Course Engine measures Learning -> Understanding -> Application -> Impact.
- Passive media completion never proves competence.
- Intelligent activities include scenario, quick check, ordering, error spotting, reflection, practical task, file evidence, simulation and official assessment.
- Evidence upload/submission is not completion; required evidence can be pending/revision/failed/passed.
- Rubrics, skill mapping, Pre/During/Post/Follow-up measurements.
- Organization impact checkpoints support 30/60/90 days; personal learning can use optional follow-up.
- AI may assist feedback/recommendations but cannot alone issue formal completion/certification.
- Hirely x KFO courses are out of current KFO scope; they belong on Hirely.
- Saudi Labor Law content is blocked pending qualified Saudi legal review.
- Excel/Power BI are not considered complete until practical units/assets are complete and tested.
- No Deploy Until MVP Gate.

## Implemented on branch
- Unified learner architecture proposal.
- Learner profile, personal/org enrollments, notifications.
- Unified progress, attempts, completions, certificate wallet.
- RPC-only profile / notification-read / lesson-progress mutations.
- Server-side official assessment design with private answer keys.
- Learner Dashboard surfaces: profile, stats, organizations, courses, notifications, certificates.
- Intelligent Course Engine schema: skills, activities, evidence, rubrics, measurements, impact checkpoints.
- Activity Runtime state machine and renderer.
- First KFO Reference Course: customer-service-reference.
- Intelligent Course Player shell/UI/runtime.
- Build pipeline includes player/reference assets.
- Regression/security tests for the above.
- Legacy organization-only learner proposal explicitly deprecated/do-not-apply.

## Reference Course
خدمة العملاء: من الفهم إلى الأثر
8 activities:
1. Pre scenario
2. Focused content
3. Error spotting
4. Expectation scenario
5. Practical escalation task + rubric
6. Ordering activity
7. Impact reflection
8. Official assessment
Skills: diagnosis, expectation management, professional escalation, closure/improvement.

## Important current limitation
Player evidence is intentionally labelled as MVP runtime draft. It is NOT yet persisted to backend. Do not claim otherwise.

## Resume next
1. Evidence Submission RPC.
2. Rubric Review Flow.
3. Skill Measurement persistence.
4. Connect Player to real enrollment/progress/evidence.
5. Connect Official Assessment + completion + certificate.
6. Run Learner Portal end-to-end gate for personal learner and organization learner.
7. Only after Learner Gate: continue Company Portal.
8. No deploy/migration promotion until full MVP Gate and owner approval.

## Owner instruction
If a product/policy/permission decision is needed, stop and ask Saud. Otherwise continue implementation and QA automatically.
