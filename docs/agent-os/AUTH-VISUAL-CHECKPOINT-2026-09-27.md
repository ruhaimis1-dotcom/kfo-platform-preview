# KFO authentication visual checkpoint — 27 Sep 2026

## Approved by Saud

- Login, forgot-password, and reset-password layout and distribution.
- White transparent approved KFO logo directly on the Deep Teal panel, with no independent white box.
- IBM Plex Sans Arabic for Arabic text and Inter for English/numbers, shipped as local font files.
- Arabic RTL and mobile layout shown in the four visual previews.

## Implemented slice

- `/login`: email/password sign-in through Supabase Auth. Success stays on the auth page until membership-aware routing exists.
- `/forgot-password`: sends a recovery message with `redirectTo` set to the current origin's `/reset-password`.
- `/reset-password`: enables password editing only after a `PASSWORD_RECOVERY` event; signs out locally after a successful update.
- The old mock login screen is removed from the homepage. Build output serves clean URLs through Vercel configuration.

## Verification and release gate

- `npm run check` (five checks covering login, recovery redirect, reset gating, validation, and error copy), `npm run build`, and production dependency audit passed at this checkpoint.
- Browser QA and an end-to-end email recovery test remain open. The cloud browser could not access local `localhost` pages.
- An exact deployed `/reset-password` URL must be allowlisted in Supabase Auth URL Configuration before sending a new test recovery email.
- The inherited homepage assets `hero-industrial-v2.png`, `home-preview.png`, and `screens-preview.png` fail PNG integrity checks. The approved KFO logo assets used by auth pass. Repair the inherited images before claiming the whole site is error-free.
- This branch is local and has not been pushed, merged, or deployed. Do not publish automatically.
