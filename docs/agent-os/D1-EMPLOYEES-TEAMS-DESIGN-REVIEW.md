# D1 Employees & Teams — design review

Status: prepared for Saud's desktop and mobile visual review; not approved. Route: `/business/employees` on isolated draft branch.

The D1 concept inherits the approved KFO logo, colors, IBM Plex Sans Arabic/Inter weights, company shell and RTL. It shows a company-scoped employee directory, team list, search and filters, active versus pending invitation states, and a design-only invitation preview. The 128 active employees across six teams match D0; six pending invitations are separately counted. Only five illustrative records are listed, and none is real.

## Contract

- A user identity is distinct from company membership. Branch, department/team scope, permissions and invitation are not inferred from the visual row.
- A team membership does not grant administrative rights. Multi-organization users and branch/department managers must be authorized server-side later.
- The invite form never sends email or persists data. Individual invitation and acceptance must work before bulk import.
- Company views exclude personal learning; course labels refer only to company assignments.
- Tenant resolution from the subdomain and `organization_id` isolation across API, database and storage belong to implementation gates B3/B4, not this design preview.
- No employee records, roles, or invitations are created by this static design. Loading/error/forbidden states and audit must be implemented and tested during the foundation work.

Review gate: verify hierarchy, fields, filters, empty results, team view and invite preview on desktop and phone; collect design approval or revisions before D2 Courses & Seats. D1 approval does not authorize merging or releasing implementation.
