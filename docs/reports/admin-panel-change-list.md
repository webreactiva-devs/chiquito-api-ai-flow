# Change list: Admin panel

- Date: 2026-10-01
- Branch: `feature/admin-panel`
- Sources:
  - **V**: [admin-panel-verification.md](admin-panel-verification.md)
  - **R/O/Y**: [admin-panel-red-team.md](admin-panel-red-team.md)
  - **D**: [admin-panel-browser-evidence.md](admin-panel-browser-evidence.md)
- Severity: 🔴 blocking · 🟠 worth discussing · 🟡 warning with no risk
- Total: 🔴 1 · 🟠 13 · 🟡 19

Each item has one ID, so that commits and pull requests can refer to it (for example, `CL-5`).

## Before merge

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-1 | 🟠 | Add HTML error and not-found handlers to the admin plugin. Cap `page` to a safe integer. Treat a non-string `_csrf` as a wrong token. | O1, D-1, D-4 |
| CL-2 | 🟠 | Make `npm run dev` rebuild the CSS: Tailwind `--watch=always`, or a process runner. Update ADR 0011. | O2 |
| CL-3 | 🟠 | Convert `parseArgs` errors in the admin CLI into a `CommandFailure` (exit code 1 and the usage line). Add a test. | O10 |
| CL-4 | 🟠 | Make the pagination tests independent: create the 45 jokes in `beforeAll`. | O11 |
| CL-5 | 🟠 | Stop the joke list page from scrolling sideways at 375 px. The hidden screen-reader labels in the Edit and Delete links escape the table card. | D-2 |

## Product owner decisions

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-6 | 🔴 | Reopen ADR 0008. Proposal: a rate limit only on `POST /admin/login` (by IP and by email), and logs for each login result and each create, update and delete. This blocks a public deploy, not the merge. | R1 |
| CL-7 | 🟠 | Joke ids are reused. Rebuild `jokes` with `AUTOINCREMENT` now, or accept the reuse in the spec. | O8 |

## Before the first deploy

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-8 | 🟠 | Add security headers to `/admin`: CSP with `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy` and `Cache-Control: no-store`. Move the inline counter script to `/admin/assets`. | O5, D-3 |
| CL-9 | 🟠 | Store `sha256(sid)`, not the raw session id. Create the database file with mode `0600`. | O6 |
| CL-10 | 🟠 | Add `PRAGMA user_version` and ordered migrations. Reclassify ADR 0004 as reversible. Write an ADR for schema evolution. | O7 |
| CL-11 | 🟠 | Add indexes on `votes(joke_id, vote_type)`, `sessions(admin_id)` and `sessions(expires_at)`. | O9, Y11 |
| CL-12 | 🟠 | Choose one production start path: `tsx` in dependencies, or `node dist/` with the views copied. Stop the start when `admin.css` is missing. | O3, V5 |
| CL-13 | 🟠 | Write a runbook for data safety: a persistent `DATABASE_PATH`, never `--force` in deploys, `sqlite3 .backup`. The CLI shows the database path that it uses. | O4 |
| CL-14 | 🟠 | Add a CI workflow (`npm ci && npm test`). Correct the CI reference in `AGENTS.md`. | O12, V6 |

## Documentation

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-15 | 🟡 | Align the spec with the code. §3.3: the `?notice=welcome` redirect, and "each successful login". §7: the font packages and `build:fonts`. §12: close the decided questions. | V1–V4, D-9 |
| CL-16 | 🟡 | README: add an environment-variable table (`DATABASE_PATH`, `COOKIE_SECURE`, `NODE_ENV`). Say that Swagger needs `NODE_ENV=production` to stay off. Update the old Express sections. | Y25, Y9 |

## Tests

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-17 | 🟡 | Automate the manual checks: CSRF and no-session POST on the 4 routes, `COOKIE_SECURE` reading, `admin:password` cases, edit validation, the "« Previous" link with filters, `db:init` as a process. | V (recommended tests) |
| CL-18 | 🟡 | Make tests stronger: assert arguments and status codes, use `data-*` hooks instead of CSS classes, move query tests next to `db.test.ts`, use `beforeEach`. | Y21, Y22 |

## Code and UX clean-up

| ID | | Change | Source |
| --- | :-: | --- | --- |
| CL-19 | 🟡 | Register CORS only for `/api` and `/health`. | Y5, D-10 |
| CL-20 | 🟡 | Set `dotfiles: "deny"` in `@fastify/static`. | Y8 |
| CL-21 | 🟡 | Add a maximum length for `category` (for example 50). | Y7 |
| CL-22 | 🟡 | Parse joke ids strictly: reject `0x10`, `1e1` and `" 5 "`. | Y14 |
| CL-23 | 🟡 | Write `new Eta({ autoEscape: true })` explicitly. | Y23 |
| CL-24 | 🟡 | Session lifecycle: clear the cookie on an expired session; show a notice when a form arrives after a logout in another tab; decide if a new login ends the earlier sessions. | D-12, D-8, D-11 |
| CL-25 | 🟡 | List texts: improve the empty state on page 1 and "Page 4 of 1"; do not show "All" for an unknown category. | D-5, D-6 |
| CL-26 | 🟡 | Make the field focus match spec §6 (3 px navy outline), or change the spec. | D-7 |
| CL-27 | 🟡 | Login CSRF: accept it in ADR 0005, or check `Origin` or `Sec-Fetch-Site` on login. | Y6 |
| CL-28 | 🟡 | Make the login concurrency limit configurable, below `UV_THREADPOOL_SIZE`. | Y10 |
| CL-29 | 🟡 | CLI details: map the duplicate-email race to "already exists"; use one command signature; close the database; end `readHiddenLine` on EOF without `process.exit`. | Y13, Y20 |
| CL-30 | 🟡 | Structure: a `buildApp(options)` factory, one `openDatabase(path)`, an optional `adminSession` type, `password` and `email` in `src/auth/`. | Y1–Y4 |
| CL-31 | 🟡 | Tidy up: constants for the `/admin` paths and cookie options, remove duplicates and unused exports, stricter types (`JokeType`, `Omit<>`), one date format. | Y15–Y19 |
| CL-32 | 🟡 | Pin the exact versions of the font packages (`build:fonts` copies fixed file names). | Y12 |
| CL-33 | 🟡 | Check the `scrypt` prefix in `verifyPassword`. Explain `p=5` in ADR 0003. | Y24 |
