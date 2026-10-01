# KFO preview

This repository contains the approved static KFO preview and an isolated authentication slice.

## Run locally

```sh
npm ci
npm run check
npm run build
```

Serve `dist/` with a static server. Vercel uses `vercel.json` to publish the build output with clean URLs, so `/login`, `/forgot-password`, and `/reset-password` resolve to their respective HTML files.

`/business/dashboard` is the D0 company dashboard **visual preview**. Its organization, people, counts and dates are fictional. The action buttons only display a preview notice; no company data is read or changed. Design approval, membership-aware routing, server authorization and real persistence remain separate gates.

## Authentication configuration

`/auth-check` is a preview-only HTTP gate for the three fixed KFO QA accounts. It requires actual sign-in and an explicit start click. An invited user's own test membership becomes active on success. Results distinguish first acceptance from retries. See `docs/agent-os/B1-BROWSER-HTTP-GATE.md` for the remaining audit/isolation gates. It is not linked from production navigation.

The client uses the KFO Supabase project URL and its **publishable** key. The key is intentionally public; never add a secret or service-role key to browser code. Authorization for private data must be enforced with RLS and the planned membership/RBAC foundation.

Before testing recovery on a deployed preview, add its exact `https://<preview-host>/reset-password` URL under **Supabase Authentication → URL Configuration → Redirect URLs**. For production, add the exact production URL and update the Site URL from localhost to the production origin during release configuration. Avoid a broad wildcard for arbitrary preview hosts.

The reset page only enables password editing after Supabase emits `PASSWORD_RECOVERY`. A normal signed-in session alone does not enable it. After saving, the browser session is signed out locally and the user is directed to sign in again. Login success now opens `/workspace`. That page verifies the user with Auth and reads only their memberships and active organizations through RLS. It distinguishes pending, active and unavailable membership states; D0–D6 and the learner portal remain separate previews.

Do not use the old dashboard-issued recovery link from the SMTP delivery check: that link was generated while Site URL was localhost. Request a new link from `/forgot-password` after adding the correct redirect URL.
