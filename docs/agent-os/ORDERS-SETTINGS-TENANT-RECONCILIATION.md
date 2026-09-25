# KFO Orders & Invoices / Company Settings — Tenant Reconciliation

Date: 2026-09-25  
Branch: `agent-os/kfo-tenant-consolidation`  
Status: architecture reconciliation complete; no visual or product-policy approval implied.

## Authority

This reconciliation applies the accepted KFO Master Spec, Data/RBAC Contract, Task Graph, Organization Tenant Architecture, Company Architecture Consolidation Gate, and KFO Approved Checkpoint 2026-09-20. Existing route names, roles, journeys, visual identity, and unresolved Human Decision Gates remain unchanged.

## D0 — Orders & Invoices

- Company purchases and their orders, order items, payment records, refunds, seat purchases/pools, entitlements, and invoices are scoped to the purchasing `organization_id`; dependent records preserve that same tenant boundary.
- The company host selects the tenant context only. Each request still authenticates the single KFO identity, checks its active membership and approved permission/scope, and relies on API/service authorization plus PostgreSQL RLS. A submitted organization id, order id, or invoice id cannot grant access.
- The existing personal `/orders` and `/orders/[id]` journeys retain personal context. Company Admin Workspace access uses the already approved Orders & Invoices surface and organization context; it does not create a second account or rename routes.
- Company invoices, payment state, seat balances, and entitlement references shown in company reporting must derive from the same organization-scoped records. Personal purchases and activity remain outside company reports.
- Payment verification pending remains distinct from failure. Paid entitlements activate only after confirmed payment. This reconciliation adds no live payment integration and makes no refund, seat withdrawal, finance-role, pricing, or commercial packaging decision.
- Cross-tenant reads, mutations, enumeration, exports, and signed asset access must fail closed, including when a user supplies another tenant's order, invoice, payment, or entitlement identifier.

## D1 — Company Settings

- Settings are read and written in the resolved organization context; all persisted tenant settings carry the stable `organization_id` and are protected by service authorization and RLS.
- Tenant branding remains limited to the accepted fields: organization logo, portal/academy name, primary/secondary colors, cover/hero media, welcome copy, and approved contact information. KFO layout, navigation, accessibility, route structure, and core UX remain controlled by the KFO Design System.
- Settings do not let tenant users edit roles/permissions, bypass membership, or change their tenant by editing a browser-supplied identifier. Membership and role administration follow the existing authorization contract.
- Branding media is stored under the tenant's stable UUID prefix in private storage and accessed through authorization checks; public rendering may use only an explicitly approved publication path.
- Sensitive setting changes record actor, organization, scope, and time in the existing audit model. Host/domain verification and future custom-domain activation remain platform-controlled; this document does not enable custom domains or white-label removal.
- Organization lifecycle and suspension/reactivation behavior remain a Human Decision Gate. No new lifecycle states or tenant self-service provisioning behavior are introduced.

## Access and unresolved decisions

- Existing roles and permission mappings remain authoritative. Finance visibility follows the existing role gate. Unresolved FI access to private company content and any expanded finance authority remain denied until decided.
- Content-manager rights, refunds, revenue share, seat withdrawal after learning starts, custom-domain activation, and tenant content/platform limits remain unchanged Human Decision Gates.
- No product UI or route has been approved by this architecture note. Company page visuals still require the existing Human Approval gates and must use only the approved KFO visual checkpoint.

## Required verification when implemented

1. Tenant A cannot read/update/export Tenant B orders, invoices, payment records, seat pools, or entitlements by host switching or guessed identifiers; authorized same-tenant paths succeed.
2. Personal `/orders` data is never exposed to company context and company transactions are never exposed through another tenant or personal context.
3. Pending payment cannot create a paid entitlement; confirmed payment maps to the correct organization-scoped entitlement without duplicate activation.
4. Cross-tenant setting writes and private asset reads/writes fail; allowed branding changes are constrained to approved fields and audited.
5. FI/content-manager cases with unresolved rights remain denied by default.
