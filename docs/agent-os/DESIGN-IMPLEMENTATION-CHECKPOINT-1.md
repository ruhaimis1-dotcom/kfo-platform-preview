# Design / Implementation Checkpoint 1 — Public Home

Date: 2026-09-24  
Branch: `agent-os/kfo-tenant-consolidation`  
Status: implementation preview ready for review; not a release gate.

## Authority and scope

The page follows the public home approved in `KFO-Approved-Checkpoint-2026-09-20(2).zip` and the identity rules in `KFO-MASTER-SPEC.md`. It is the first visual implementation slice after Foundation/Tenant Checkpoint 0. It does not change the approved product architecture, routes, roles, pricing, learning rules, or company workspace design. It does not replace the approved design checkpoint.

## Implemented

- Replaced the root reference iframe with a responsive RTL public-home implementation matching the approved information hierarchy: navigation, hero, value propositions, course discovery, paths, learning steps, company CTA, partners, certificate verification, CTA and footer.
- Added the approved palette as CSS tokens and installed pinned local font packages for IBM Plex Sans Arabic and Inter.
- Kept `index.html` unchanged and available through the copied `/kfo-preview.html` reference asset.
- Used approved route names in navigation and CTA links; no new product routes were introduced.
- No database, API, payment, or production changes were made.

## Explicit gaps

- Original approved hero photography and usable approved logo artwork are not present as reusable source assets in the repository or the checkpoint ZIP. Existing repository PNG files are invalid image streams. This implementation therefore displays a clearly marked neutral hero illustration area and a text-only KFO wordmark; neither is a final substitute for the approved artwork.
- Course cards and the business diagram are static presentation examples, not live catalogue or tenant data.
- The linked destinations are architectural route targets; those pages and interactions are not part of UI0 and may not yet be implemented.
- This checkpoint does not establish that real Supabase Auth, API persistence, or tenant context is working in Preview.

## Verification

- `npm test`: 17/17 tenant-core tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `/` is statically rendered and `/api/tenant/context` remains dynamic.
- Production or `main` deployment: not performed.

## Next

1. Review this implementation in a protected Vercel Preview.
2. Supply the original approved logo and hero image assets (or their trusted source file) before visual completion of the public home.
3. Continue the Agent OS route implementation sequence, verifying each route and permission boundary before the next slice.
4. Keep company visual screens behind their existing individual Human Approval gates.
