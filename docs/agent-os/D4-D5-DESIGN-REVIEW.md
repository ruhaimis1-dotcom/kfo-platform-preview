# D4 Reports & Certificates / D5 Orders & Invoices — design review

Status: design approved by Saud on 28 Sep 2026; implementation, merge, release and phone QA remain open. Routes: `/business/reports` and `/business/orders`.

These pages inherit the approved KFO company shell, logo, bundled font and weights, colour palette, RTL, card frames, buttons and inline SVG icon set. Names, dates, prices, order numbers and quantities are expressly illustrative.

## D4

- Company reporting includes only its assignments; individual learning outside company assignments is excluded.
- September illustration reconciles with D0: 96 assignments = 38 complete + 42 underway + 16 not started. The course table totals 80 licensed assignments plus 16 company content assignments.
- A certificate ledger shows active, expired and revoked examples, preserving history and binding to course version. The count of 31 active issued certificates is illustrative and does not assume every completed assignment grants a certificate.
- Search and kind filters work locally. Export and certificate view only show preview notices; no real data, private record or public verification is exposed.

## D5

- Three paid illustrative purchases total 104 licensed seats: 40 + 40 + 24. D2 shows 80 previously allocated and 24 remaining from these purchases.
- One pending-verification order of ten seats is excluded from the purchased/available seat count and has no issued invoice.
- Orders can be filtered by state. Detail dialog distinguishes confirmed payment from pending verification. Prices and IDs are design examples, not quotations or issued invoices.
- Real payment references, once-only entitlement creation, invoices, refunds, permissions, tenant isolation and audit remain implementation gates. No policy for refunds or seat withdrawal is invented by the preview.

Review desktop and phone typography, table/card transitions, empty filters, certificate status wording and paid/pending order details. Design approval is distinct from implementation, merge and release.
