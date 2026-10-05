# Learner Architecture — MVP decision 2026-10-05

## Identity
One authenticated user has one learner profile. A user may learn personally, through one or more organizations, or both at the same time. Learner type is never a fixed user attribute.

## Learning contexts
- personal enrollment: initiated by the learner/KFO, no organization required.
- organization assignment: issued through an active organization membership and carries organization/branch/department context.

Both contexts feed the same progress, assessment, completion, certificate and notification experience.

## Learner surfaces
- Profile: identity and learner-facing profile fields.
- Dashboard: personal and organization learning statistics, with combined totals and context filters.
- My learning: Personal courses and Work/organization courses shown separately.
- Certificates: one wallet, each certificate states its learning context.
- Notifications: assignment, due-date, inactivity reminder, assessment result, certificate issuance and course updates.

## Data rules
A learning activity must point to exactly one enrollment context. Organization learning never leaks into another tenant. Personal learning remains owned by the user and is not visible to an employer unless separately assigned through that employer. One user can have multiple organization memberships without duplicate learner profiles.

## Release rule
No Deploy Until MVP Gate.
