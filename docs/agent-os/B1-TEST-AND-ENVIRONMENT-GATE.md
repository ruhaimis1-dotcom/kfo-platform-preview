# B1 — Test and environment gate

Date: 28 Sep 2026. Status: preview checks and KFO database inspection executed; application foundation not yet connected to the preview.

## Executed against this repository

| Check | Result | Boundary |
| --- | --- | --- |
| Authentication unit/flow suite | 5/5 pass | Supabase client is mocked. No real email, login session or role route was exercised. |
| Static build | Pass | Bundles approved auth and D0–D6 company previews. |
| Built route/asset scan | 13 HTML pages, zero broken local references | Resolves Vercel-style clean URLs and shipped assets. It does not exercise a deployed host or browser layout. |
| Archived Laravel backend | Not executed | PHP/Composer and a configured database are unavailable in this workspace. Its only located test cases are example skeletons. |
| KFO Supabase project | Connected: project `ktkdcfxeaicbykdurlfg`, healthy | Existing tenant foundation: 11 public tables with RLS, four earlier migrations, one Auth user and zero organizations, memberships, domains or audit records at inspection. No test identities were created. |
| Public tenant discovery | Migration `20260928203103_scope_public_tenant_branding` applied | Corrects an unrelated-domain match in anonymous branding RLS; grants anonymous SELECT only on resolver fields; explicitly excludes disabled tenants even for privileged resolver callers. |
| Public tenant behavior | `supabase/tests/tenant_public_discovery.sql` passed: verified/active visible (1), pending invisible (0), disabled invisible (0) for both branding and host resolver; private contact column unreadable by anon | Three synthetic organizations were inserted inside a transaction and rolled back. Persisted organization/domain/branding/audit counts remained zero. This does not test authenticated membership or an HTTP host. |
| Security advisor | One warning | Leaked password protection is disabled in Auth. No Auth configuration API was available in this connection; enable it in KFO Auth settings before release. |

## B1 configuration checklist

1. Record the final backend/auth decision against `B0-SOURCE-INVENTORY.md`. KFO already has a PostgreSQL/Supabase tenant foundation and its preview uses Supabase Auth; the archived Next.js/Laravel/MySQL pair remains a behavior reference. Do not silently combine the two session models. Preserve approved routes and visual identity.
2. Use the connected KFO project only for controlled setup and read-only checks until an isolated development/test environment and nonproduction identities are available. Document deployment origin, migration source and access roles without committing secret keys. The browser may contain only a publishable key.
3. Configure exact `/reset-password` redirect origins for the preview and future production host in KFO Auth settings. Verify a fresh link from the deployed `/forgot-password` page; do not reuse a localhost-era SMTP test link. Record email delivery and recovery as a live test separately from the five mocked tests.
4. Define one session contract, server-side current user, active organization membership and tenant resolution from `{tenant}.kfo.sa`. Reject mismatched host/organization, unauthorized roles and cross-tenant asset access. Keep identity separate from memberships.
5. Implement the first vertical slice on test data: organization → branch → department → invitation → employee acceptance → dashboard/member list. Seed two organizations and a user with memberships in both.
6. Gate B1 with API tests: employee forbidden from company settings; BM restricted to branch/department; user permissions differ across organizations; cross-tenant reads/writes/asset access denied; audit actor/time/before/after; no unauthenticated company data. Add browser/mobile/RTL journey checks once the backed pages exist.

The existing `private.create_organization` function is executable by `postgres` only. Company creation therefore needs a trusted bootstrap flow; no self-service browser INSERT policy was added. Current D0–D6 cards still show sample data. Passing preview and anonymous tenant-discovery checks does not mark authenticated B1 API, tenancy or payment gates as passed.
