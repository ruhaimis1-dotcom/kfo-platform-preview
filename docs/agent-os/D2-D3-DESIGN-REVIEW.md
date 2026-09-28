# D2 Courses & Seats / D3 Training Assignment — design review

Status: prepared for Saud's visual review on an isolated draft branch. Routes: `/business/courses` and `/business/assignments`.

Both previews inherit the approved company shell, KFO logo, colours, RTL, IBM Plex Sans Arabic/Inter weights, card frames, and SVG icon language from D0/D1. All names, course content, counts, seats and dates are illustrative.

## D2 contract

- Show licensed KFO courses with course-specific available seats; the illustrative 12 + 8 + 4 = 24 available seats matches D0.
- Show private company content separately. Owned/company-created content does not consume KFO course seats by default.
- Search and content-kind filter are local preview interactions. Purchase is a notice only; no payment, entitlement or seat balance changes.
- Each course leads to D3 with the course preselected for a design-only assignment review.

## D3 contract

- Follow course → employees or team → deadline → seat review → confirmation preview.
- If the illustrative beneficiary count exceeds that course's balance, disable confirmation and explain the shortage. A different course's seats cannot cover it.
- Company content shows no KFO seat requirement. Team counts and members are illustrative; actual duplicates, scopes, membership, access, rights, dates and quotas must be validated server-side.
- The confirmation dialog sends no notification, creates no assignment, and deducts no seat.

## Remaining gates

Review desktop and phone layouts, filters, course cards, insufficient-seat state, team versus individual selection and confirmation wording. Design approval does not authorize implementation merge or release. Commerce, authorization, tenant isolation, audit and persistence remain in the B/C quality gates.
