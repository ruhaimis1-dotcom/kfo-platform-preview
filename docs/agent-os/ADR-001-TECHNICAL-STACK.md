# ADR-001 — KFO application and backend stack

Status: **Accepted — 24 Sep 2026**  
Decision scope: technical implementation platform only. No product, route, role, visual or commercial policy changes.

## Context and constraints
KFO requires Arabic RTL company and employee experiences, a single identity with memberships in multiple organizations, scoped RBAC, host-based tenant resolution (`{company-slug}.kfo.sa`), a shared tenant database with strict isolation, future custom-domain aliases, and an extraction seam for dedicated enterprise infrastructure. The product also requires versioned learning content, progress, assessments/results, certificates/verification, tenant commerce, reporting, audit and secure private media. The selected repository is a static preview with Vercel preview automation and no existing application/backend framework to preserve. The approved architecture identifies PostgreSQL as the data model and records Laravel/MySQL only as an implementation option; it does not mandate that option. “Taa” is recorded as an unavailable reference and was not reconstructed or used as evidence.

## Decision
- **Web application:** Next.js App Router, React, TypeScript; deploy previews through the existing Vercel workflow. Keep server-only tenant/auth/data code separate from browser UI. Use RTL and the approved KFO fonts, tokens and routes unchanged.
- **Backend/database:** Supabase-managed PostgreSQL, with SQL migrations as the schema source of truth. Supabase Auth supplies the single user identity/session. Postgres RLS is the final tenant row-authorization boundary; Next.js server/service code performs a second authorization check.
- **Tenant context:** resolve the request host at the trusted application edge. Public portal lookup is an invoker function with column-limited grants and RLS; authorization `SECURITY DEFINER` helpers live in a non-exposed private schema and require `auth.uid()`. `{slug}.kfo.sa` maps to the organization; verified custom-domain aliases use the same organization id. Host selects context only. Every tenant request revalidates identity, active membership, role and branch/department scope. The selected organization id is never accepted as authorization by itself and is not trusted as a long-lived JWT claim.
- **Storage:** Supabase Storage private bucket(s), tenant-scoped object keys and Storage RLS backed by the same authorization helpers. Issue short-lived signed access only after server authorization. Keep provider/bucket placement behind a storage adapter and tenant placement metadata so a future enterprise tenant can move to dedicated storage.
- **Enterprise extraction seam:** tenant-owned records and object metadata have stable organization scope; connection/storage placement is a server-only tenant routing abstraction. Shared infrastructure remains the default. No per-customer project, database or provisioning is created in this phase.
- **Commerce:** implement order/payment abstractions and test-mode state transitions only. No live payment provider credentials, checkout or external payment calls in Foundation/Tenant Layer.

## Alternatives considered

| Option | Fit | Decision |
|---|---|---|
| Next.js + Supabase/PostgreSQL | Single relational source for memberships, roles, RLS, transactions, Auth and Storage; supports server-rendered RTL portals and Vercel preview; standard PostgreSQL supports later managed/dedicated placement | **Selected** |
| Laravel + MySQL | Mature backend and relational transactions; viable for KFO. It is an existing documented option, but no Laravel app or MySQL environment exists in the inspected repository. MySQL would diverge from the approved PostgreSQL data design and require an explicit mapping decision | Not selected for this checkpoint |
| Next.js + external API (custom Node/Nest) + PostgreSQL | Strong service separation and portability, but introduces a separate backend deployment and auth/storage integration without existing code that needs it | Deferred; revisit only if service complexity or scale evidence requires it |
| Firebase/Firestore | Fast hosted auth/storage and flexible document model | Rejected: relational joins, strict multi-dimensional scopes, seat/order transactions and SQL RLS align more directly with PostgreSQL contract |

## Consequences and risks
- RLS policies must be treated as required security code; a table grant without RLS is a release blocker. Keep `SECURITY DEFINER` helpers out of exposed schemas, pin empty `search_path`, require an authenticated identity where appropriate, and run Supabase advisors before merge. Service-role credentials bypass RLS and must remain server-only, narrowly used and audited.
- Complex reporting may require carefully secured SQL functions/materialized views; views must not bypass tenant filters.
- Supabase managed service creates provider coupling for Auth/Storage. The PostgreSQL schema, domain interfaces and storage adapter reduce data/provider coupling, but identity migration still requires a planned export/migration path.
- Vercel/Supabase regional placement, data residency, video delivery costs and enterprise isolation plans require later operations review; they do not change the logical architecture.
- Custom domain activation requires ownership verification and verified status before resolution. Commercial activation remains subject to the existing package decision gate.

## Security invariants
1. No RLS policy relies on an organization id supplied by browser input without an active membership check.
2. Unknown host, unverified domain, missing identity, missing membership and ambiguous scope fail closed.
3. Membership/role changes take effect on the next authorization check; active organization context is a selector, not a capability.
4. Tenant database and storage tests include cross-tenant negative cases through the real API/RLS boundary.
5. Never expose Supabase service-role keys or private object keys through client bundles/logs.
6. Public certificate verification uses a deliberately limited read model, never direct access to private learner records.

## Unavailable reference
“Taa” is **Unavailable Reference**. No file or repository was supplied, and its content is not inferred. The approved KFO contracts contain no technical requirement that makes inspection of Taa mandatory. It is not a blocker and is not used in this decision.

## Verification basis
Current official Next.js documentation identifies App Router as the current routing model (latest listed docs version 16.2.7); Supabase documentation describes PostgreSQL RLS as the database authorization layer, requires RLS and grants to be set for exposed tables, and documents Storage RLS. These support the fit of the selected technologies; they do not replace KFO-specific isolation testing.

## Official references
- Next.js App Router: https://nextjs.org/docs/app
- Supabase PostgreSQL Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Auth RBAC/custom claims: https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac
