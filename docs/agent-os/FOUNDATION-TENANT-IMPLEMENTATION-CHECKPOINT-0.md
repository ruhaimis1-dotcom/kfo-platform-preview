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

- Host normalization/tenant mapping, active membership context, request-context boundary, and Supabase read adapter are in `packages/tenant-core`. Next.js trusted-host extraction and Auth `getUser()` wiring remain for app-shell integration.
- Four migration files in `supabase/migrations/` match the deployed KFO project history: `20260924080920`, `20260924080939`, `20260924081958`, and `20260924082130`.
- All 11 public tables have RLS enabled; 10 role codes and 18 permission codes are seeded. Private `tenant-private` Storage bucket uses organization UUID path prefixes.
- Tenant isolation/RBAC/host pgTAP suite: **18/18 passed** against the KFO project. The extension and synthetic test fixture were scoped to a transaction and rolled back; follow-up queries confirmed 0 organizations, 0 memberships and 0 test users persisted.
- Tenant-core unit tests: **17 passed, 0 failed**. Supabase Security Advisor: no findings. Performance warnings for unindexed foreign keys and duplicate permissive SELECT policies were resolved; unused-index INFO notices remain because the tenant tables have no workload yet.
- API/service isolation tests and runtime Storage list/read/write/delete/signed-access tests remain. No Next.js application shell exists yet, so trusted-host/Auth integration and RTL shell QA remain.
- No visual identity, route, role, or product policy was changed. No live payment integration, production release, or merge to `main`.

## Remaining Foundation work

1. Integrate trusted hosting request metadata and Supabase Auth `getUser()` in the Next.js application request adapter.
2. Add API/service tests for cross-tenant reads, writes, enumeration, exports, and signed object access using separate test identities; retain the hosted pgTAP result as database-policy evidence.
3. Add API/service tests for cross-tenant reads, writes, enumeration, exports, and signed object access using separate test identities.
4. Complete course/content/licensing, learning, assessments, certificates, commerce, and reporting schemas only in their respective Task Graph phases.
5. Complete trusted-host/Auth app-shell wiring and security/Arabic RTL QA, then request Human Approval before merging to `main` or releasing production.

## Gate status

Checkpoint 0 and the Company Architecture Consolidation Gate are accepted. The first implementation slice is in progress on the feature branch. No unresolved product decision blocks the current technical foundation work; unresolved capability-specific permissions and commercial policies remain deny-by-default. Foundation exit requires database and API/service/Storage isolation evidence, not only helper unit tests.
