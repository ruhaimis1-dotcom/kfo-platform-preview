# B1 role context — 1 October 2026

Status: **prepared and tested; not applied, wired, pushed or deployed**.

Historical preparation checkpoint. Superseded by `B1-HTTP-ASSETS-CHECKPOINT-2026-10-01-AR.md`: RPC subsequently applied, workspace wired locally, live anonymous HTTP passed. Authenticated HTTP/Storage and deployment remain pending; SQL connector permission was lost during the next fixture rehearsal.

## Slice

`supabase/proposals/my_access_context.sql` defines a read-only authenticated RPC. Its public wrapper is SECURITY INVOKER; a private, explicitly guarded SECURITY DEFINER function reads only `auth.uid()`'s active memberships in enabled companies. This narrow definer is needed because the existing EM role cannot read `membership_roles`. No existing grants or RLS policies are changed. No company membership grants platform administration.

The response keeps organization/membership scope separate and retains branch/department scope per role. A narrower membership scope is retained when a role has a null scope. Incompatible role and membership scopes are omitted. Permissions are attached to each scoped role, never flattened into global permissions. User-editable metadata and email do not select roles. No caller identity or organization argument is accepted. Existing mutation endpoints must continue checking authorization independently; this context is for navigation/display only.

`auth/access-context.mjs` verifies Auth before calling the RPC, rejects malformed/duplicate context and API errors, and re-verifies the identity after the response to discard data from a changed session. It is staged and intentionally not imported into the deployed workspace until the RPC and HTTP checks are ready.

## Verification

- `npm run check`: build and **28/28** local tests passed; five new context tests cover identity verification, separate scopes, forged metadata, malformed/error responses and a changed session.
- Database integration on **KFO `ktkdcfxeaicbykdurlfg`** used one transaction: `BEGIN` + proposal + `supabase/tests/my_access_context.sql` + `ROLLBACK`.
- The successful run checked two companies with different roles for one user, CO versus BM settings permissions, BM branch scope, EM reading its own role while direct role-table reads remain empty, forged SA metadata, inactive membership, disabled company, missing identity and anonymous denial.
- Initial test-fixture update failed because an inactive membership requires `ended_at`; fixture corrected and the full transaction passed.
- Subsequent read confirmed zero fixture users/companies, no persisted proposed RPC, and the three original QA memberships still active.
- Security advisor review returned no database RLS/function findings; the existing Auth leaked-password-protection warning remains outside this slice.
- Current Supabase changelog and function/RLS documentation reviewed. PostgreSQL minor-release notes concern ltree/pgcrypto/btree_gist/custom operators; this slice adds none of these.

## Gate and continuation

G1 remains open. SQL integration is not authenticated HTTP evidence or a private Storage asset test. The browser inventory contained only a blank tab; the previous KFO authenticated session is not available in this browser. No new password or session was created.

Next work:
1. Generate a migration through the Supabase CLI from the tested proposal, apply through the normal migration workflow, and verify the RPC over authenticated HTTP for CO/BM/EM and anonymous users.
2. Prepare two-company fixtures and real private assets; run HTTP read/write/signed-link isolation checks and clean only those fixtures.
3. Connect workspace role labels and the first actual role portal to the verified server context; retain explicit empty/loading/denied/error states and independent endpoint authorization.
4. Complete RTL/mobile checks, then present the concrete preview at Human Gate. No automatic production publishing.

Separate SA account and permission design remain pending; the existing Saud CO account has not been promoted.
