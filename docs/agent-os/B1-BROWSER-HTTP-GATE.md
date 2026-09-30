# B1 browser HTTP gate — 30 Sep 2026

Status: fixture-only runner prepared; authenticated live results remain pending. This is a diagnostic surface, not invitation/settings production UI.

`/auth-check` uses the KFO publishable key and the user's browser session. It never requests a pasted token, exports credentials, or uses a service-role key. The user enters their own password in the page. Unknown accounts are rejected. Every test uses project `ktkdcfxeaicbykdurlfg` and the fixed QA organization `aa7a54d0-9bce-455d-adb4-971c21d9fdf1`.

## Current fixture checkpoint

Read-only inspection on 30 Sep: CO active, BM active scoped to the existing test branch, EM invited. All three Auth identities have confirmed emails. CO and BM have no recorded sign-in; EM's last sign-in is 27 Sep, and latest recovery request is 29 Sep 13:03:47 UTC. Recovery completion and a new successful sign-in have not been verified. No database mutation or new Auth identity was made during this preparation.

## Checks

1. The actual token is verified through Auth `/user`; only one of the fixed three IDs can run.
2. Own membership matches the QA organization and is invited or active.
3. Anonymous acceptance and accepting another fixture user's membership return `401/403`, code `42501`. Failure stops before own acceptance.
4. Own acceptance/retry returns the correct ID; a subsequent HTTP read shows active status. An already-active membership is reported as retry, not first acceptance.
5. EM reads only self; BM's returned rows are self or in the assigned branch; CO reads QA organization memberships.
6. BM/EM settings requests are denied. CO verifies the current fixed test company name, then requests that unchanged name. This proves RPC access, not a changed-name write or its audit.

The only intended persisted change is an invited fixture user's own membership becoming active after pressing the labeled start button. Verify audit actor/count/before/after separately through SQL. Cross-tenant HTTP and private Storage remain open; no second tenant fixture is present in this runner. Invitation issuance HTTP and email delivery remain separate.

## Gate

Local runner tests use stubbed HTTP responses and cannot establish authenticated live success. Build, route checks and original auth tests are required. Run EM first, then BM/CO with local sign-out between accounts; record actual time/results, then inspect membership/audit before business UI wiring. The connector exposes no Auth URL Configuration method, so the current preview reset redirect allowlist has not been verified. The user must complete recovery from a fresh email link on the current origin.
