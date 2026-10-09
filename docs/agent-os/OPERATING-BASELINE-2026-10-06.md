# KFO Operating Baseline — 2026-10-06

Purpose: first evidence baseline under the adopted operating charter. Do not infer improvement until a comparable future round exists.

## Available evidence
- Current working branch: agent-os/kfo-learner-portal-mvp-20261005.
- Course Engine gate: Conditional PASS, documented in docs/agent-os/COURSE-ENGINE-GATE-2026-10-06.md.
- No production deploy performed in this workstream.
- Rework evidence observed in repository history:
  1. organization-only learner assumption was replaced by unified personal/organization enrollment model;
  2. fake filename-only evidence path was blocked until private storage verification;
  3. post skill score helper was connected into official assessment transaction during gate review.
These are baseline rework/defect categories, not improvement claims.

## Metrics status
- Time to acceptable result: not reliably measurable from repository evidence alone; baseline starts now.
- Saud intervention time: not measured with reliable timer; baseline starts now.
- Rework rounds: repository documents at least the three architecture/security corrections above; future rounds should count from this charter.
- Repeated defects: no repeated defect rate established yet.
- Actual cost: unavailable from project evidence; do not estimate.

## Next comparable measurement
For Integration Validation + Learner Portal Gate record:
- number of blocking defects found;
- number fixed in the same round;
- number requiring Saud decision;
- tests added/updated;
- whether any previously fixed defect category recurs.
