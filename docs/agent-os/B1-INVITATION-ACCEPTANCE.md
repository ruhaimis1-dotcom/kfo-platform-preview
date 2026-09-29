# B1 — Existing-user invitation acceptance

Status: applied to KFO on 29 Sep 2026. Transactional SQL test passed and rolled back; authenticated HTTP test remains pending.

The current schema can invite an **existing Auth user ID** by inserting an `invited` organization membership and assigning a scoped role. It has no email-address invitation token, delivery or pending-user claim flow. This slice accepts only that existing-user invitation; the email delivery workflow remains separate.

## RPC contract

`public.accept_invitation(p_membership_id uuid) -> uuid` is executable by `authenticated` only. It is a security-invoker wrapper around `private.accept_existing_user_invitation`. The private security-definer function:

- requires `auth.uid()` and matches it to the membership's `user_id`;
- requires an enabled organization, `invited` or already `active` membership, and an assigned role before activating an invitation;
- locks the membership row, changes `invited` to `active` with a server timestamp, and relies on the existing audit trigger for actor/before/after;
- returns the same ID on an authorized retry, without writing a second audit event;
- returns one generic authorization error for someone else's, disabled, suspended or incomplete invitation.

The browser receives no table UPDATE grant and no service-role key. The caller's Supabase session supplies the user ID; the client does not submit an email or target user ID as proof.

## Verification before use

`supabase/tests/invitation_acceptance.sql` passed against KFO inside one transaction. It exercises own acceptance, retry, anonymous and cross-user denial, disabled tenant denial, missing-role denial, and audit count, then rolls back all fixtures. Afterwards the database still had one original Auth user and zero organizations, memberships, or audit events. The authenticated HTTP RPC test with nonproduction sessions remains pending before wiring the UI.

Migration `20260929063838_accept_existing_user_invitation.sql` matches the version recorded in project `ktkdcfxeaicbykdurlfg`. The RPC exists, `authenticated` can execute it, `anon` cannot, and `authenticated` still lacks direct UPDATE on memberships. No migration was applied to Hirely.
