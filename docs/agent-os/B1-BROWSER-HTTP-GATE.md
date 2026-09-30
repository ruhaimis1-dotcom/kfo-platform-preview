# B1 browser HTTP gate — 30 Sep 2026

Status: EM authenticated HTTP gate passed on 30 Sep 2026; BM/CO, audit and foundation exit checks remain pending. This is a diagnostic surface, not invitation/settings production UI.

`/auth-check` uses the KFO publishable key and the user's browser session. It never requests a pasted token, exports credentials, or uses a service-role key. The user enters their own password in the page. Unknown accounts are rejected. Every test uses project `ktkdcfxeaicbykdurlfg` and the fixed QA organization `aa7a54d0-9bce-455d-adb4-971c21d9fdf1`.

## Current fixture checkpoint

Historical SQL inspection on the morning of 30 Sep (superseded for EM by the live HTTP results below): CO active, BM active scoped to the existing test branch, EM invited. All three Auth identities have confirmed emails. CO and BM have no recorded sign-in; EM's last sign-in is 27 Sep, and latest recovery request is 29 Sep 13:03:47 UTC. Recovery completion and a new successful sign-in have not been verified. No database mutation or new Auth identity was made during this preparation.

## Checks

1. The actual token is verified through Auth `/user`; only one of the fixed three IDs can run.
2. Own membership matches the QA organization and is invited or active.
3. Anonymous acceptance and accepting another fixture user's membership return `401/403`, code `42501`. Failure stops before own acceptance.
4. Own acceptance/retry returns the correct ID; a subsequent HTTP read shows active status. An already-active membership is reported as retry, not first acceptance.
5. EM reads only self; BM's returned rows are self or in the assigned branch; CO reads QA organization memberships.
6. BM/EM settings requests are denied. CO verifies the current fixed test company name, then requests that unchanged name. This proves RPC access, not a changed-name write or its audit.

The only intended persisted change is an invited fixture user's own membership becoming active after pressing the labeled start button. Verify audit actor/count/before/after separately through SQL. Cross-tenant HTTP and private Storage remain open; no second tenant fixture is present in this runner. Invitation issuance HTTP and email delivery remain separate.

## Gate

Local runner tests use stubbed HTTP responses and cannot establish authenticated live success. Build, route checks and original auth tests are required. Run EM first, then BM/CO with local sign-out between accounts; record actual time/results, then inspect membership/audit before business UI wiring. The exact current preview reset redirect was saved and verified through the KFO dashboard with user approval on 30 Sep. The user subsequently reported completing login and acceptance; the existing EM session was independently verified during the evening HTTP run below.

## Login landing follow-up — 30 Sep

The user reported successful login and invitation acceptance. This is user-reported evidence, not an independently inspected database/audit result. The Supabase connector now denies read permission, so no new state or audit query has succeeded.

Replaced the fixed login success placeholder with `/workspace`: Auth verifies identity; RLS reads are filtered to the current user's memberships and their active organization IDs. Pending/active/unavailable/empty/error states are explicit. No role is inferred from email or user-editable metadata, no table grants or database writes are added, and no sample business dashboard is entered. A test-organization-only link returns to the HTTP runner. Role-specific company/employee portals, invitation issuance, cross-tenant/storage tests and audit verification remain open.

## Independently verified preview — 30 Sep 2026, approximately 20:03 Riyadh

Vercel reports success for commit `9e492bcd2ca4d7ac55b3f521d3a9e454863bfe88`; its tree `9094a070cbec3de9781708f4ab9c87baee5a9bde` matches the local tested tree. Build and all 23 local tests pass. The deployed `/login` automatically redirected an existing server-verified EM session to `/workspace`, which displayed the real QA organization and active membership. This verifies existing-session routing, not a newly submitted password login.

The actual `/auth-check` EM run completed all 9 HTTP checks: identity 200, own membership 200, anonymous denial 401/42501, cross-user acceptance denial 403/42501, two active retries 200, persisted active read 200, self-only membership scope 200, settings denial 403/42501. EM was already active before execution: first acceptance and its audit were not tested in this run. No credentials were exported.

KFO connector `get_project` still returns permission denied. SQL audit actor/count/before/after remains blocked; BM/CO authenticated HTTP, cross-tenant HTTP, private Storage and role-specific portal wiring remain pending. G1 stays open.
