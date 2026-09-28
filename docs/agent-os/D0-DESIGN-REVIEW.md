# D0 Company Training Dashboard — design review

Status: DESIGN APPROVED by Saud on 28 Sep 2026 after desktop review and three mobile recordings. This is design approval only; implementation and merge remain separate gates.

Route: `/business/dashboard` on an isolated preview branch. The static screen shows the approved KFO visual identity, company workspace navigation, training indicators, three primary actions, progress distribution, alerts and a deadline/status table. The example organization, people, dates and numbers are fictional and labelled as such on the page.

The actions show a preview notice. Other company navigation items say “قريباً”; a visible sidebar is not implementation of those pages. No membership routing, real tenant data, backend authorization, purchase or assignment is implied. Company reporting excludes personal learning by contract.

## Refinement for review

- The September demo cohort contains 96 assignments: 38 complete, 42 in progress, 16 not started. The displayed completion rate is 38 / 96, rounded to 40%; labels state the period and denominator.
- A design-only scenario selector shows a populated company, a new company, depleted seats, and a load error. The primary action changes with the context. Disabled assignment controls explain their prerequisite. The error view never displays stale figures as current.
- On narrow screens, alerts precede metrics, and assignment rows become readable cards rather than requiring horizontal table scrolling.
- Navigation and metric icons use one inline SVG set. The KFO logo, approved colours, IBM Plex Sans Arabic / Inter and their bundled weights remain intact.

Review gate: passed on 28 Sep 2026. The mobile review covered the four D0 scenario states, the company menu, and the page experience preview; the hero crop and temporary notice were refined before approval. D1 Employees & Teams follows. Implementation follows the separate B/C gates in `TASK-GRAPH.md`.
