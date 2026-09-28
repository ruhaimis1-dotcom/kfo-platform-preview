# B1 — Test and environment gate

Date: 28 Sep 2026. Status: preview checks executed; application foundation not yet implemented.

## Executed against this repository

| Check | Result | Boundary |
| --- | --- | --- |
| Authentication unit/flow suite | 5/5 pass | Supabase client is mocked. No real email, login session or role route was exercised. |
| Static build | Pass | Bundles approved auth and D0–D6 company previews. |
| Built route/asset scan | 13 HTML pages, zero broken local references | Resolves Vercel-style clean URLs and shipped assets. It does not exercise a deployed host or browser layout. |
| Archived Laravel backend | Not executed | PHP/Composer and a configured database are unavailable in this workspace. Its only located test cases are example skeletons. |
| KFO Supabase project | Not inspected through the connected management account | The available project list contains only Hirely Platform; the KFO URL in the preview points to a different project. No live auth/database setting was changed. |

## B1 configuration checklist

1. Record a backend/auth decision against `B0-SOURCE-INVENTORY.md` before adding any persistent organization schema. The preview uses Supabase Auth, while the older Next.js/Laravel pair uses a different auth flow and MySQL. Preserve approved KFO routes and visual identity regardless of stack.
2. Use a KFO-specific development environment and nonproduction test identities. Document its project/ref or API origin, deployment origin, migration source and access roles without committing secret keys. The browser may contain only a publishable key.
3. Configure exact `/reset-password` redirect origins for the preview and future production host in KFO Auth settings. Verify a fresh link from the deployed `/forgot-password` page; do not reuse a localhost-era SMTP test link. Record email delivery and recovery as a live test separately from the five mocked tests.
4. Define one session contract, server-side current user, active organization membership and tenant resolution from `{tenant}.kfo.sa`. Reject mismatched host/organization, unauthorized roles and cross-tenant asset access. Keep identity separate from memberships.
5. Implement the first vertical slice on test data: organization → branch → department → invitation → employee acceptance → dashboard/member list. Seed two organizations and a user with memberships in both.
6. Gate B1 with API tests: employee forbidden from company settings; BM restricted to branch/department; user permissions differ across organizations; cross-tenant reads/writes/asset access denied; audit actor/time/before/after; no unauthenticated company data. Add browser/mobile/RTL journey checks once the backed pages exist.

Current D0–D6 cards still show sample data. Passing preview build/route tests does not mark any B1 API, tenancy or payment gate as passed.
