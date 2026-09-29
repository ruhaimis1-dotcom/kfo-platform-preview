# B1 — Existing Auth user invitation issuance

Status: narrow database slice applied to KFO on 29 Sep 2026; transactional SQL journey passed and rolled back. Authenticated HTTP and D1 UI tests remain pending.

`public.invite_existing_employee(p_organization_id uuid, p_user_id uuid)` allows an active company owner with `members.manage` to create an invited membership and its `EM` role atomically for an existing Auth user. The private function validates the caller and enabled company, locks the organization row, checks that the target Auth user exists, and rejects an existing membership with a generic error. No role or tenant ID is accepted from a browser as a source of authority. Existing audit triggers record the issuer. This slice does not send email or create an Auth user, and does not yet assign a branch or department.

Migration `20260929082338_invite_existing_employee.sql` matches KFO history. The rolled-back `supabase/tests/invite_existing_employee.sql` verified owner issuance, duplicate/cross-tenant/disabled-tenant/unknown-user/anonymous/employee denial, direct CO role escalation denial, and subsequent acceptance by the invited employee with the expected audit and role. Afterwards KFO retained its original one Auth user and zero organizations, memberships, roles, or audit events.

The D1 invite dialog still previews an email and team. It must not call this UUID-only RPC from that UI as if it sent a message. A trusted lookup/delivery and pending-user flow, team scoping, and authenticated HTTP tests with disposable identities remain before wiring the dialog.
