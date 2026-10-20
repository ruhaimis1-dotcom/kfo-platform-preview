# R07 implementation checkpoint — 20 October 2026

Approved visual reference: KFO-Full-Preview-R07.html. Approval authorizes implementation, not publication.

Implemented locally:
- Approved homepage headline, description, CTA destinations and original generated hero compressed to WebP (~106 KiB). Pointer effect is restricted to fine mouse pointers/desktop and honors reduced motion.
- Shared R07 style treatment attached to auth/workspace/company/admin and generated learning pages.
- Company/admin home, workspace, session-local signout and switch-account controls; logout errors retain context and prevent navigation.
- Learner home and switch-account controls, retaining existing logout and role-aware routing.
- Existing organization structure and responsibility settings are linked from the employee team panel with organization context preserved. This is not a new teams backend.
- Three approved illustrative course cover assets, descriptive alternative text and proper aspect ratio.
- Public catalogue domain filtering combines with Arabic-normalized search, with only nonempty domains shown.

Verification:
- npm run check: build plus 323 tests passed (including failed-logout, account switching and context cleanup checks).
- git diff --check passed.
- No current-build browser, mobile, authenticated two-account or live DB action acceptance performed. Tests are not a substitute for these gates.

Outstanding before final review/release:
- Full visual comparison of actual rendered role pages with R07 (not merely shared CSS).
- Real invitation acceptance, scoped department/manager edits, assignments, learner progress, evidence upload/review and certificate/verification/download flows.
- Mobile navigation, responsiveness, keyboard focus and observed navigation latency.
- Existing-account invitations only; onboarding new users/email delivery remains an existing product limitation.
- Dedicated teams backend and complete organization directory presentation remain open; structure settings currently provide the actual supported operations.
- No Neoleap connection or paid order completion. Excel/Power BI drafts remain inactive.

Deployment unchanged. No push, publish or production database modification this round. Not final-review ready until the remaining gates are evidenced.
