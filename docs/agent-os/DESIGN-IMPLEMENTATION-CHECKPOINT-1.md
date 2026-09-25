# Design / Implementation Checkpoint 1 — Public Home

Date: 2026-09-24  
Branch: `agent-os/kfo-tenant-consolidation`  
Status: implementation preview ready for review; not a release gate.

## Authority and scope

The page follows the public home approved in `KFO-Approved-Checkpoint-2026-09-20(2).zip` and the identity rules in `KFO-MASTER-SPEC.md`. It is the first visual implementation slice after Foundation/Tenant Checkpoint 0. It does not change the approved product architecture, routes, roles, pricing, learning rules, or company workspace design. It does not replace the approved design checkpoint.

## Implemented

- Replaced the root reference iframe with a responsive RTL public-home implementation matching the approved information hierarchy: navigation, hero, value propositions, course discovery, paths, learning steps, company CTA, partners, certificate verification, CTA and footer.
- Added the approved palette as CSS tokens and installed pinned local font packages for IBM Plex Sans Arabic and Inter.
- Revised the hero composition to match the approved full-page checkpoint reference: KFO wordmark/navigation, people imagery on the left, headline and actions on the right, with the same dark forest and signal green treatment. Course and company imagery now use crops from the approved composite preview.
- Kept `index.html` unchanged and available through the copied `/kfo-preview.html` reference asset.
- Used approved route names in navigation and CTA links; no new product routes were introduced.
- No database, API, payment, or production changes were made.

## Explicit gaps

- Original standalone hero/course/team photography and vector logo artwork are not present as reusable assets. The current preview extracts small raster crops from the approved full-page composite, which improves fidelity for review but is temporary and not a production-quality asset source. Replace them with the trusted originals when available.
- Course cards and the company preview image are presentation examples, not live catalogue or tenant data.
- The linked destinations are architectural route targets; those pages and interactions are not part of UI0 and may not yet be implemented.
- This checkpoint does not establish that real Supabase Auth, API persistence, or tenant context is working in Preview.

## Verification

- `npm test`: 17/17 tenant-core tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `/` is statically rendered and `/api/tenant/context` remains dynamic.
- Vercel Preview recovery (2026-09-25): initial deployment returned `404 NOT_FOUND`. Inspection found the Vercel project Framework Preset set to `Other` although this repository is a Next.js application. The project preset was corrected to `Next.js`, then the feature branch was redeployed as **Preview** with the old build cache disabled.
- Verified in browser after redeployment: the deployment-specific Preview URL and the branch Preview alias both return the KFO root page (title `كفو`) instead of the Vercel 404. This confirms availability of `/` only; it is not approval of the page's visual fidelity or of D2's rejected visual proposal.
- Public-home visual revision on 2026-09-25 now renders on the branch Preview. Desktop browser QA confirms the approved hero image/text direction and all seven preview images load. `npm test` (17/17), `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass for this revision.
- Owner's screen recording on 2026-09-25 confirms the root page loads, but clicking visible destinations such as `/business/dashboard`, `/paths`, and `/partners` returns 404 because those route pages are not implemented yet. This is an application route-coverage gap, separate from the repaired Vercel root-page deployment. `/business/dashboard` remains blocked by the D2 visual approval gate; other route destinations remain in their Task Graph sequence.
- Production or `main` deployment: not performed.

## Visual approval boundary

The public-home visual is being aligned with its existing approved checkpoint, but this implementation revision still requires owner visual review and is not a final visual sign-off. The 2026-09-25 owner decision approves the D2 Company Training Dashboard architecture and page breakdown only. The proposed D2 visual is rejected for mismatch with the approved KFO identity. D2 route implementation remains gated until a replacement visual is reviewed and approved against `KFO Approved Checkpoint 2026-09-20`.

## Next

1. Review this implementation in a protected Vercel Preview.
2. Supply the original approved logo and hero image assets (or their trusted source file) before visual completion of the public home.
3. Continue the Agent OS route implementation sequence, verifying each route and permission boundary before the next slice.
4. Keep company visual screens behind their existing individual Human Approval gates.
