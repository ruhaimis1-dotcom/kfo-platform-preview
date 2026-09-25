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
- Replaced the low-resolution homepage photo crops with larger crops sourced from the approved standalone hero and catalogue/course checkpoint images. These are higher-resolution review assets; the trusted original production photo/logo files are still not available.
- Implemented `/catalog` using its approved catalogue checkpoint: RTL navigation and filters, course cards, responsive layout, illustrative-data note, and working GET search/category filtering against the preview catalogue.
- Implemented `/catalog/communication-skills` using the approved course-detail checkpoint. Other preview course cards do not link to this specific course. Purchase, gifting and team-seat actions remain visual preview targets; they do not create orders or grant entitlements.
- Implemented `/verify-certificate` using its approved checkpoint. The displayed sample code is explicitly labeled illustrative; no actual certificate database lookup or validity decision is made.
- Kept `index.html` unchanged and available through the copied `/kfo-preview.html` reference asset.
- Used approved route names in navigation and CTA links; no new product routes were introduced.
- No database, API, payment, or production changes were made.

## Explicit gaps

- Original vector logo artwork and reusable source photography are not present. Current images are crops from approved checkpoint renders, including a larger standalone hero, so image sharpness is improved for preview but these remain raster review assets rather than trusted production originals.
- Course cards and the company preview image are presentation examples, not live catalogue or tenant data.
- `/catalog`, the approved communication-course detail route, and `/verify-certificate` now render. `/paths`, `/partners`, `/business/dashboard`, `/login`, `/register`, `/about`, `/contact`, and other linked destinations remain unimplemented and may return 404. The company dashboard remains behind the rejected-visual Human Approval gate; other pages require their design sequence before implementation.
- Catalogue filters other than search and category chips, sorting, pagination, course enrollment/payment, course video playback and live catalogue data are not connected. All prices and listings are illustrative as stated in the approved checkpoint.
- This checkpoint does not establish that real Supabase Auth, API persistence, or tenant context is working in Preview.

## Verification

- `npm test`: 17/17 tenant-core tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `/` is statically rendered and `/api/tenant/context` remains dynamic.
- Vercel Preview recovery (2026-09-25): initial deployment returned `404 NOT_FOUND`. Inspection found the Vercel project Framework Preset set to `Other` although this repository is a Next.js application. The project preset was corrected to `Next.js`, then the feature branch was redeployed as **Preview** with the old build cache disabled.
- Verified in browser after redeployment: the deployment-specific Preview URL and the branch Preview alias both return the KFO root page (title `كفو`) instead of the Vercel 404. This confirms availability of `/` only; it is not approval of the page's visual fidelity or of D2's rejected visual proposal.
- Public-home visual revision on 2026-09-25 now renders on the branch Preview. Desktop browser QA confirms the approved hero image/text direction and all seven preview images load. `npm test` (17/17), `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass for this revision.
- Owner's screen recording on 2026-09-25 confirms the root page loads, but clicking visible destinations such as `/business/dashboard`, `/paths`, and `/partners` returns 404 because those route pages are not implemented yet. This is an application route-coverage gap, separate from the repaired Vercel root-page deployment. `/business/dashboard` remains blocked by the D2 visual approval gate; other route destinations remain in their Task Graph sequence.
- 2026-09-25 catalog/detail/certificate implementation: `/catalog`, `/catalog/communication-skills`, and `/verify-certificate` compile as rendered routes. `npm test` (17/17), `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass. Search and category query states render server-side. The certificate route only displays an explicitly labeled sample; it does not query real records. This does not validate real course data or commerce.
- Production or `main` deployment: not performed.

## Visual approval boundary

The public-home visual is being aligned with its existing approved checkpoint, but this implementation revision still requires owner visual review and is not a final visual sign-off. The 2026-09-25 owner decision approves the D2 Company Training Dashboard architecture and page breakdown only. The proposed D2 visual is rejected for mismatch with the approved KFO identity. D2 route implementation remains gated until a replacement visual is reviewed and approved against `KFO Approved Checkpoint 2026-09-20`.

## Next

1. Review the public home, catalogue and course-detail implementation in a protected Vercel Preview; visual approval is still pending.
2. Supply trusted original KFO logo and photo assets before visual completion of the public home.
3. Continue approved public-page routes in Task Graph order. Do not ship links to routes that are still unimplemented without addressing their page gate.
4. Keep company visual screens behind their existing individual Human Approval gates.
