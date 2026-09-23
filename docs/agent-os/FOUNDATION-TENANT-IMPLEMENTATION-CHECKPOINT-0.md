# KFO Foundation/Tenant Layer — Implementation Checkpoint 0

Status: **Checkpoint 0 accepted; Foundation/Tenant Layer implementation in progress**  
Architecture Gate: accepted by product owner on 24 Sep 2026.  
Repository: `ruhaimis1-dotcom/kfo-platform-preview`  
Branch: `agent-os/kfo-tenant-consolidation` (descends from `agent-os/kfo-master-spec`)  
Source state: changes remain in Draft PR #2; no main merge or production deployment.

## I0 — Repository inventory

The complete visible GitHub tree was inventoried, including `docs/agent-os/` and nested assets. Before this checkpoint, the repository contained a static Arabic RTL preview and reference images, but no application/backend implementation.

| Artifact | State |
|---|---|
| `index.html` and preview/logo images | Static visual reference only; not the product application |
| Agent OS Master Spec, Data/RBAC, Task Graph | Existing architecture contracts; reconciled without renaming routes/roles |
| Application framework/API/Auth/database/storage before this slice | Not present |
| KFO Approved Checkpoint 2026-09-20 | Sole approved visual/identity reference; unchanged |

## I1 — Technical architecture decision

I1 is accepted in `ADR-001-TECHNICAL-STACK.md`: Next.js App Router + React + TypeScript, Supabase Auth, shared PostgreSQL with RLS, and private Supabase Storage. PostgreSQL matches the approved logical model and the repository's Vercel preview workflow; no existing production framework needed preservation. Laravel/MySQL and a separately deployed custom API were compared and not selected for this checkpoint.

“Taa” is recorded as an **Unavailable Reference**. No supplied source was reconstructed or treated as truth. No accepted contract establishes a technical dependency on it, so it does not block implementation.

## Current implementation evidence

- Host normalization/tenant mapping and active membership context helpers in `packages/tenant-core`.
- Shared PostgreSQL foundation schema, existing role-code seed, permissions, host aliases, branding, audit, RLS, and explicit grants in `supabase/migrations/202609240001_tenant_foundation.sql`.
- Private tenant bucket and Storage RLS in `supabase/migrations/202609240002_tenant_storage.sql`.
- Two/three-tenant pgTAP fixture covering multi-membership, RBAC, host resolution, custom-domain verification, branch scope, and cross-tenant reads/writes in `supabase/tests/tenant_isolation.test.sql`.
- Unit tests: **7 passed, 0 failed**. SQL/pgTAP tests are authored but not run because Supabase CLI, PostgreSQL client, and Docker are unavailable in this environment.
- No visual identity, route, or product policy was changed. No real payment integration is included.

## Remaining Foundation work

1. Integrate trusted hosting request metadata and Supabase Auth in the application request adapter.
2. Run both migrations and pgTAP against local Supabase/PostgreSQL; resolve runtime SQL findings.
3. Add API/service tests for cross-tenant reads, writes, enumeration, exports, and signed object access using separate test identities.
4. Complete course/content/licensing, learning, assessments, certificates, commerce, and reporting schemas only in their respective Task Graph phases.
5. Complete security and Arabic RTL shell QA, then request Human Approval before merging to `main` or releasing production.

## Gate status

Checkpoint 0 and the Company Architecture Consolidation Gate are accepted. The first implementation slice is in progress on the feature branch. No unresolved product decision blocks the current technical foundation work; unresolved capability-specific permissions and commercial policies remain deny-by-default. Foundation exit requires database and API/service/Storage isolation evidence, not only helper unit tests.
