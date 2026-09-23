# KFO Agent OS Task Graph

## Locked inputs
- Approved KFO visual identity and logo
- Approved page architecture/journeys
- Assessment UI contract
- Result UI contract
- This Master Spec and Data/RBAC Contract

## Execution DAG
A0 Repository audit [done]
A1 Master Spec [done in this branch]
A2 Data Model + RBAC Contract [done in this branch]
A3 Architecture Gate [pending human approval]
B1 Create production application shell [blocked by A3]
B2 Implement design tokens/layout primitives [depends B1]
B3 Authentication/session [depends B1]
B4 Database schema + tenant policies [depends A2,B1]
C1 Company workspace [depends B2,B3,B4]
C2 Trainee workspace [depends B2,B3,B4]
C3 KFO admin workspace [depends B2,B3,B4]
D1 Course/path/enrollment engine [depends C1,C2]
D2 Progress engine [depends D1]
D3 Assessment/attempt engine [depends D1,B4]
D4 Result engine [depends D3]
D5 Certificate issuance [depends D2,D4]
D6 Public certificate verification [depends D5]
E1 Reporting queries/dashboard [depends D1,D2,D4,D5]
F1 Automated functional tests [depends C/D/E]
F2 Tenant isolation/security tests [depends B4,C/D/E]
F3 Responsive/browser QA [depends B2,C/D/E]
F4 Human approval gate [depends F1,F2,F3]
F5 Release candidate [depends F4]

## Agent rules
- Do not rewrite locked architecture or identity.
- Do not use prototype numbers as production facts.
- Do not implement authorization only in UI.
- Do not merge implementation into main before quality gates.
- Raise a Human Decision Gate only for product-policy changes.
