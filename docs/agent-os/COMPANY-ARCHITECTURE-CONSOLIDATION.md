# Company Architecture Consolidation Gate — KFO

Status: **Accepted by product owner 24 Sep 2026**  
Branch: `agent-os/kfo-tenant-consolidation` based on `agent-os/kfo-master-spec`  
Scope: final architecture reconciliation, followed by gated Foundation implementation. No main merge or production deployment.

## Authority used
1. KFO Approved Checkpoint 2026-09-20 — sole visual/identity authority.
2. Existing approved company architecture decisions and Organization Tenant Architecture locked 23 Sep 2026.
3. Draft PR #1 and Agent OS Master Spec, Data/RBAC Contract and Task Graph.
4. Repository preview is evidence of existing files only; `index.html` is not final product implementation.

## Consolidated architecture contract

| Area | Locked contract | Foundation representation/status |
|---|---|---|
| Domain model | Organization is stable tenant root; one identity, personal context, many scoped memberships | Organizations/memberships/branches/departments schema authored |
| RBAC | Existing role codes unchanged; membership roles scoped to org/branch/department; host does not authorize | Permission catalog, source-supported seed, RLS predicates authored; unresolved rights denied |
| URL/host | `{company-slug}.kfo.sa`; custom aliases map to same org id after verification | Host resolver helper and exact verified host lookup authored |
| Auth/session | Stable KFO identity; active company context is a selector; every request rechecks membership and scope | Context helper authored; Supabase request adapter still required |
| Database | Shared PostgreSQL by default, strict organization scope + API/service checks + RLS; future dedicated placement seam | Initial schema/RLS/grants authored; SQL runtime and API integration tests not yet run |
| Storage | Private tenant assets keyed by stable org UUID, same authorization boundary, short-lived signed access | Private bucket and Storage RLS authored; runtime object tests remain |
| Branding | Controlled logo/name/colors/cover/welcome/contact values within KFO system | Constrained fields authored; app validation/UI not yet built |
| Admin workspace | Separate authorized company administration experience with existing routes | Architecture locked; implementation belongs to later phases |
| Employee Portal | Distinct employee learning experience at tenant host; employee never receives admin access by host alone | Architecture locked; implementation belongs to later phases |
| Library/content | Owned, company-created, licensed/purchased and assigned origins; private owned/company-created content; seats only when applicable under contract | Contract locked; detailed content/licensing schema belongs to C1/C5 |
| Learning/results | Versioned courses, progress, assessments/results and explicit personal/company context | Contract locked; schemas belong to C1/C3 |
| Certificates | Bound to course version and learning context; minimal public verification projection | Contract locked; schema belongs to C4 |
| Reporting | Organization-scoped; excludes personal/other-tenant activity | Contract locked; schema/views belong to C5, protected by RLS |
| Commerce | Tenant orders/invoices/seats/entitlements; confirmed payment before paid entitlement | Contract locked; schema belongs to C2; no real payment integration in Foundation |

## Approved / locked
- KFO identity and visual rules per 20 Sep checkpoint.
- Existing role codes, routes and approved journeys remain unchanged.
- Company Training Dashboard, Employees & Teams, Company Courses/Content/Seats, Training Assignment, Reports/Certificates and Organization Tenant Architecture are architecture-approved.
- Shared multi-tenant architecture; subdomain is not a database boundary.
- One KFO identity with multiple memberships; separate Company Admin Workspace and Employee Portal.
- Owned/company-created content private by default; personal learning excluded from company analytics.
- `index.html` remains preview/reference only.

## Unavailable reference
“Taa” is recorded as **Unavailable Reference**. No source was supplied, no content is inferred, and the approved architecture contracts contain no technical dependency that makes it mandatory. It is not a blocker.

## Human Decision Gates — unchanged
- Content-manager permissions and review/publish authority.
- FI access to private company content and expanded finance authority.
- Organization lifecycle and suspension/reactivation rules.
- Revenue share, seat withdrawal after learning starts, refunds, assessment defaults/renewals.
- Commercial packaging for custom domains, attribution/white-label, and private-content/platform limits.

These gates do not block technical foundation implementation. Affected capabilities remain deny-by-default; no policy is inferred by ADR-001 or the schema.

## Checkpoint 0 and implementation status
- I0 repository inventory is complete: static preview/reference and Agent OS docs; no pre-existing production app stack was found.
- Checkpoint 0 accepted. I1 resolved by ADR-001: Next.js App Router/React/TypeScript, Supabase Auth, shared PostgreSQL/RLS, private Supabase Storage.
- Initial host/context helpers, database/RBAC/audit migration, Storage policy migration, and pgTAP tests are authored on the feature branch.
- Unit tests pass 7/7. pgTAP has not been run because this environment lacks Supabase CLI, PostgreSQL client and Docker. Actual API/service/Storage integration tests remain.
- No real payment provider or production deployment is included. Visual preview assets and routes are unchanged.

## Execution order
1. Complete migration and pgTAP validation against local Supabase/PostgreSQL.
2. Implement hosting/Auth request adapter and test real API/service isolation for two organizations and multi-membership users.
3. Test private Storage list/read/write/delete and signed access across tenants.
4. Continue content, learning, certificates, commerce and reporting in their Task Graph phases.
5. Run security and RTL checkpoint; seek Human Approval before any merge to `main` or production release.
