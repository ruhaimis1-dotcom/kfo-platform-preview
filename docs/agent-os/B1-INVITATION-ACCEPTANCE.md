# B1 — Existing-user invitation acceptance

Status: prepared for KFO database review; not applied or live-tested yet.

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

Run `supabase/tests/invitation_acceptance.sql` against the connected KFO project in one transaction. It exercises own acceptance, retry, cross-user denial, disabled tenant denial, missing-role denial, and audit count, then rolls back all fixtures. Recheck that the original Auth-user count and zero organization/membership counts remain unchanged. Then test the RPC over HTTP with actual nonproduction sessions before wiring the UI.

The migration was generated locally as `20260928210735_accept_existing_user_invitation.sql`. On application, align its filename with the version recorded in Supabase migration history. The connected account must list project `ktkdcfxeaicbykdurlfg` before any application. The connection switched to Hirely during preparation, so no KFO migration was attempted successfully and no Hirely schema was changed.
