# B1 — Company display name setting

Status: narrow database slice applied to KFO on 29 Sep 2026; SQL role test passed and rolled back. Authenticated HTTP and UI tests remain pending.

`public.update_company_display_name(p_organization_id uuid, p_display_name text)` allows an active member with `organization.settings.manage` to change only the organization's display name. It trims the input, requires 2–120 characters, rejects control characters, and does not write an unchanged value. The checked private function uses `auth.uid()` and the existing tenant permission helper. Browser roles receive no direct UPDATE grant on `organizations`. The existing trigger audits the actor and before/after values.

Migration `20260929081005_update_company_display_name.sql` matches the KFO migration history. `supabase/tests/company_display_name.sql` exercised owner success, repeat, anonymous/employee/cross-tenant denial, invalid name, and one audit UPDATE inside a transaction. After rollback KFO had one original Auth user and zero organizations, memberships and audit events.

This covers only the company name. Portal branding, branch and department management, notifications, billing, and the rest of D6 remain separate. The D6 preview still shows sample data and does not save changes. Before wiring it, use nonproduction Auth sessions to test this RPC through HTTP and verify the audit and tenant boundaries with persisted disposable fixtures.
