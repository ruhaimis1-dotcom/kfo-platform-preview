# KFO R08 recovery — 2026-10-21

Recovered repository branch recovery/kfo-20261015-onboarding at 4ced56de22ea0c4ed8146c07c9a0f19eb8097fcd. Earlier local R08 commits were not available remotely; the changes here were implemented again from the recorded scope. This is not a byte-for-byte recovery of those commits.

Implemented: contain-fit 16:9 covers, lesson cards and hash-based single-section reading with no-JS full content fallback; compact learner metrics and profile layout using existing saved fields; single scoped company dashboard entry; owner settings section links and access explanation; grouped admin course cards with Arabic search and publication/readiness filters preserving editor mutation guards; scoped live employee ranking with top 5/10, search, departments and available metrics. No new role grants or payment activation.

Validation: npm run check: build and 328 tests passed. Controller/unit checks are not browser visual QA. Existing Supabase company_employee_training_ranking function verified read-only with explicit tenant/scope/auth gate; execute grants exclude anonymous role. No database changes in this recovery. training_hours remains null in the existing RPC, with UI excluding unmeasured metrics.

SCCC: Node v22.23.2, npm 10.9.8, git 2.34.1 and 449G available confirmed by user; nginx -t successful with an unrelated OCSP warning. No KFO directory found in checked server paths. Draft vhost in deployment/sccc/kfo.nginx.conf is NOT installed/tested on server. No SSH access from this workspace. Existing Zawed/HEXA configuration not changed.

Remaining launch gates: browser desktop/mobile and authenticated role QA; source/data review for Excel/Power BI drafts (not activated); copy build into an isolated server release; test vhost and local Host header routes; Supabase approved domain redirect settings; DNS change from Vercel CNAME to verified SCCC address only after server readiness; HTTPS issuance and post-release checks. No live launch performed.
