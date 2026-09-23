# KFO Foundation/Tenant Layer — Implementation Checkpoint 0

Status: **Prepared; implementation not started**  
Architecture Gate: accepted by product owner on 24 Sep 2026.  
Repository: `ruhaimis1-dotcom/kfo-platform-preview`  
Starting branch: `agent-os/kfo-tenant-consolidation` (descends from `agent-os/kfo-master-spec`)  
Source state: consolidation PR #2 head before this checkpoint update.

## I0 — Repository inventory

Inventory was performed through the complete GitHub contents tree available on the selected branch, with nested `docs/agent-os` and `upload` folders inspected.

| Artifact | Present | Classification |
|---|---:|---|
| `index.html` | Yes | Single-file Arabic RTL static visual preview; explicitly not the final product |
| `home-preview.png`, `hero-industrial-v2.png`, `screens-preview.png` | Yes | Preview/reference images |
| `logo-approved.png`, `upload/logo.png` | Yes | Logo assets; implementation must reconcile against approved checkpoint asset before reuse |
| `docs/agent-os/KFO-MASTER-SPEC.md` | Yes | Product/architecture contract |
| `docs/agent-os/DATA-RBAC-CONTRACT.md` | Yes | Tenant/data/RBAC contract |
| `docs/agent-os/TASK-GRAPH.md` | Yes | Execution DAG and quality gates |
| `docs/agent-os/COMPANY-ARCHITECTURE-CONSOLIDATION.md` | Yes | Accepted architecture gate and gap record |
| `README.md`, `package.json`, `vercel.json`, `.github/workflows` | Not found at inspected paths | No documented setup/build/test workflow evidenced |
| Application source tree/framework manifest | Not found in complete visible tree | No production app scaffold evidenced |
| API/services, auth/session, database migrations/policies, storage rules, tenant tests | Not found in visible tree | Tenant layer is not implemented in this repository state |
| Vercel | Preview deployment reported by Draft PR integration | Preview automation exists; no production release evidence or app build contract found |

### Preview behavior inspected
The HTML declares Arabic RTL and references IBM Plex Sans Arabic and Inter via Google Fonts. It contains CSS variables and two responsive media-query blocks. Its only inline JavaScript switches between `.screen` elements using hashes. This is preview navigation, not authentication, persistence, API authorization, or tenant isolation.

### Source-to-domain mapping

| Domain / surface | Current artifact | State |
|---|---|---|
| Approved public/learner visuals | `index.html` and image assets | Partial visual preview only |
| Company Admin Workspace | No application route/component found | Missing implementation |
| Employee Portal at tenant host | No host resolver or app route found | Missing implementation |
| Identity, auth and session context | None found | Missing |
| Organization, branches, departments, memberships | Contract only | Missing persistence/logic |
| RBAC/API authorization | Contract only | Missing |
| Database tenant policies/migrations | None found | Missing |
| Tenant storage boundary | None found | Missing |
| Tenant branding validation | Contract only | Missing |
| Tenant Learning Library and licensing | Contract only | Missing |
| Assignments and company commerce | Contract only | Missing |
| Organization-scoped reporting | Contract only | Missing |
| Automated functional/security/browser QA | No test harness or workflow found | Missing |

## I1 — Technical architecture decision record

### Evidence-backed decision
The selected repository does not contain an application framework, dependency manifest, backend, database connection, migrations or test harness. Therefore repository inspection does **not** prove a stack choice.

Preserve the approved design model: relational PostgreSQL data design and the existing documented implementation option of Laravel/MySQL remain in source architecture v1.1. Do not silently convert one into a final implementation choice. Before code implementation, record a technical ADR choosing the concrete framework/database from the approved source materials and deployment constraints. This is a technical gate, not a product-policy gate.

### Non-negotiable foundation architecture
- Shared multi-tenant relational persistence is the default, with an authoritative `organization_id` boundary on tenant-owned data.
- Tenant host resolution, identity/session, membership/RBAC and active organization context are separate layers.
- API/service and persistence authorization fail closed; UI hiding is not an authorization control.
- Tenant files have server-authorized tenant-scoped keys/metadata.
- A tenant placement abstraction preserves a future dedicated-infrastructure path without provisioning per-tenant systems in this checkpoint.
- Preserve existing approved routes, role codes, journey semantics, KFO identity and checkpoint visuals.

## I2–I6 — First implementation work packages (not started)

1. I1 technical ADR: select and document the concrete stack from source and operating constraints.
2. I2 Tenant Resolution + Context: host resolver and aliases, stable organization identity, explicit context switch, fail-closed unknown host.
3. I3 Persistence + authorization: migrations, organization scoping, tenant-aware query/service boundary, role/scope checks and audit.
4. I4 Storage: tenant-scoped key metadata, authorization before read/write, no trusted caller paths.
5. I5 Foundation QA: two-tenant isolation, multi-membership, role/scope, unknown host, context switching, storage access and audit.
6. I6 Checkpoint: implementation diff, migration/architecture snapshot, QA evidence and unresolved decision list. Stop before public release.

## Start/exit criteria

Start implementation only after this checkpoint and ADR are visible in the working branch. Keep work in a feature branch and PR. Do not merge to `main` or deploy production without Human Approval. Exit only when all tenant-isolation tests pass at database/API/service/storage layers, and there is evidence for expected deny paths as well as authorized access. Do not implement unresolved product policies; keep those capabilities disabled or deny-by-default.
