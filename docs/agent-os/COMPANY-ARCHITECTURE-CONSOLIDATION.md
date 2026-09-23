# Company Architecture Consolidation Gate — KFO

Status: **Ready for Human Review**  
Branch: `agent-os/kfo-tenant-consolidation` based on `agent-os/kfo-master-spec`  
Scope: documentation/architecture reconciliation only. No production implementation, main merge, or production deployment.

## Authority used
1. KFO Approved Checkpoint 2026-09-20 (START-HERE, KFO Architecture/Page Structure v1.1, approved identity, 16 visual previews).
2. Existing architecture approvals supplied by the user for company pages and Organization Tenant Architecture locked 2026-09-23.
3. Draft PR #1 and the three `docs/agent-os/` contracts.
4. Repository preview is evidence of present artifacts only; `index.html` is not product implementation.

## Gate reconciliation

| Area | Contract after reconciliation | Repository evidence before this gate | Gap / gate result |
|---|---|---|---|
| Domain model | Organization is tenant root; one user identity plus personal context and many scoped memberships; stable tenant identifier and host aliases | Existing entities mention organizations, memberships, branches/departments, but no explicit tenant identity/host alias or identity-vs-context rule | Contract added; schema implementation absent/unverified |
| RBAC | Existing role codes retained; membership scope is org/branch/department; tenant resolution grants no rights; employee/admin surfaces separated | Roles and broad isolation invariant present; request-context and employee/admin surface boundary missing | Contract added; role exceptions remain human gates |
| URL/Host resolution | `{tenant}.kfo.sa` resolves tenant context; approved product routes remain; future custom host alias maps to same org ID | Route map has `/business/*`; tenant subdomain/custom-domain mapping absent | Architecture contract added; hosting/DNS/onboarding not implemented |
| Auth/session context | One identity, explicit personal/tenant active context, explicit audited switch, revalidation on each request | Identity distinct from membership; session/context behavior absent | Contract added; implementation absent |
| Database tenancy | Shared multi-tenant DB default; authoritative org scope on every tenant-owned row/query; fail-closed boundary; dedicated placement seam | General API/services/DB/storage isolation only | Specific shared model and extraction seam added; DB policy/ORM/migrations unverified |
| Storage isolation | Tenant-scoped keys; server checks object authorization; caller path never trusted | Asset authorization invariant only | Contract added; bucket/policy/object implementation absent |
| Branding/theming | Logo, academy name, primary/secondary colors, cover, welcome and contact fields; constrained by KFO identity/accessibility | Basic customization token/content boundary absent in current contracts | Added; arbitrary CSS/script or layout changes forbidden |
| Company Admin Workspace | Existing company route family; admin functions; employee cannot land here without proper role | Checkpoint route family and page architecture documented, no app shell established by contracts | Semantics preserved; actual admin workspace implementation absent |
| Employee Portal | Branded portal at tenant host; Home, My Courses, Company Library, Paths, My Certificates, My Requests; no admin access for employees | Checkpoint learner flows exist; corporate employee portal/tenant library context absent | Added as distinct experience; visuals not approved and implementation absent |
| Courses/content/licensing | Owned, company-created, licensed/purchased and assigned origins; private tenant-owned content; KFO seats only for licensed items absent a separate approved limit | private_content/seat entities listed; ownership/origin/licence and no-seat invariant absent | Added; role/publishing/commercial exceptions remain gates |
| Reporting | Explicit learning context and tenant scope; company analytics omit personal/other-tenant activity | Excludes personal learning already stated | Stronger scope/context rule added; actual views/access control absent |
| Commerce | Orders/invoices/purchases/seats assigned to active org; payment invariants preserved | generic commerce entities and invariants only | Added; Orders & Invoices UX/policies must be re-aligned; no transaction implementation verified |
| Company Settings | Tenant profile/branding/settings under explicit roles; finance/private-content permissions remain gated | Route `/business/settings` and broad matrix exist; no explicit tenant boundary/branding handling | Added contract; final authority mapping remains human decision |

## Approved / locked
- KFO identity: logo, colors, fonts and visual rules per checkpoint.
- Existing role codes and approved journeys/routes: no rename.
- Company architecture approvals: Dashboard; Employees & Teams; Company Courses/Content/Seats; Training Assignment; Reports/Certificates; Organization Tenant Architecture.
- Shared multi-tenant architecture with strict organization scoping; subdomain does not imply database-per-tenant.
- Two company experiences, one KFO identity per person, tenant learning library, private-by-default owned/company-created content, personal analytics excluded.
- Checkpoint visuals are the only approved visual source. Company previews remain unapproved visually.
- `index.html` remains preview/reference only.

## Present repository state (what has and has not been verified)
- Draft PR #1 is open, draft, based on `agent-os/kfo-master-spec` and targets `main`; it introduces Master Spec, Data/RBAC and Task Graph.
- Master Spec already contains the Organization Tenant Architecture section.
- Data/RBAC has general company isolation and identities/roles/entities but not the complete host/session/tenant-library/storage/branding/two-experience contract.
- Task Graph still labels D0 company visual review as next and lacks a prior Architecture Consolidation Gate or prepared Foundation checkpoint.
- PR repository files include static `index.html` and preview images. No production app structure, migrations, backend policies, storage rules, auth/session implementation or tenant tests were evidenced in the reviewed files. This is an inventory gap, not proof no implementation exists elsewhere in repository; I0 must verify full tree.
- The visual checkpoint ZIP exists in the project Library and its START-HERE, architecture/page map, and identity were reviewed. It explicitly states that company pages have not received visual approval.

## Human Decision Gates (product/commercial policy; do not infer)
1. Content Manager authority and review/publish rights.
2. FI access to private tenant content and exact Orders & Invoices permissions.
3. Organization lifecycle states and suspension/reactivation behavior.
4. Revenue share, withdrawal of seat after learning starts, refunds, default passing/renewal rules.
5. Commercial packaging for full white-label/KFO attribution removal, custom-domain activation and platform limits on private content.
6. Backend implementation choice only if inventory shows material mismatch with existing PostgreSQL design / Laravel-MySQL option.
These do not block the shared-tenant architecture contract. Unapproved policy capabilities default to deny/off.

## Recommended execution order
1. Human reviews and accepts this Architecture Consolidation Gate.
2. I0 full repository/source inventory and source-to-domain/page/API/entity/test map.
3. I1 record technical ADR after repository evidence; no product-policy decision.
4. I2 host resolution + identity/session/tenant context.
5. I3 database tenant enforcement + RBAC + audit.
6. I4 tenant storage isolation and future placement boundary.
7. I5 branding validation and Employee/Admin workspace routing.
8. I6 tenant library and scoped reporting/commerce foundations.
9. Run Foundation/Tenant Layer QA and security gate; save implementation checkpoint.
10. Human approval before merge to `main` or production deployment.

## Checkpoint boundary
Architecture contracts and this report are documentation artifacts. Foundation/Tenant Layer implementation has **not** started. The next implementation checkpoint is I0–I6 above, to begin only after Human acceptance of this gate. This PR does not merge into main and does not publish production.
