# Design Preview Checkpoint 2 — Company Training Dashboard

Date: 2026-09-25  
Branch: `agent-os/kfo-tenant-consolidation`  
Status: **ready for Human visual approval; implementation not started**

## Preview

`previews/COMPANY-TRAINING-DASHBOARD-D2.svg` is a static design proposal for the first company screen in the approved sequence. It is not an application route and it contains no live data or interactions.

## Design basis

- Company Training Dashboard architecture is already approved: employee, assignment and seat indicators; Add Employee, Assign Course and Buy Seats actions; progress/deadline/status table; alerts and reports.
- Visual language follows the sole approved KFO checkpoint: forest/green palette, Arabic RTL, restrained surfaces, concise dashboard layout and existing IBM Plex Sans Arabic / Inter typography.
- Navigation labels reflect the already approved Company Admin Workspace areas. This proposal does not define or rename routes.
- All names and numbers shown are illustrative placeholders, not business data, targets, policy, or catalogue content.

## Not introduced

No new roles, permissions, commercial rules, seat behavior, course policy, company lifecycle, branding freedom, or external integrations are proposed. Orders & Invoices and Company Settings remain scoped by the accepted tenant reconciliation. No employee view is placed in the administration workspace.

## Review gate

Human visual approval is required before implementing this screen in the application. Requested review: approve the proposed visual direction, or identify specific changes. After approval, the screen can move to route implementation and then API/RBAC, RTL/mobile, accessibility, and tenant-isolation checks. D3 and later company screens remain gated in their approved sequence.

