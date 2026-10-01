# Red Team report: Admin panel

- Branch: `feature/admin-panel` (commit `9ea2341`)
- Date: 2026-10-01
- Reviewers: five read-only subagents, each with one mission: code quality, security, architecture, a six-month premortem, and devil's advocate against the decisions.
- Method: each subagent reported findings with evidence. The main session then reproduced the findings that are fastest to check (marked **Reproduced**), removed duplicates and corrected false positives. The final severity is the main session's judgement. Where it differs from a reviewer, the report says why.

## Severity

- 🔴 Blocking. Fix or decide before the stated gate (merge or public deploy).
- 🟠 Worth discussing. Fix soon or accept explicitly.
- 🟡 Warning with no risk now.

## Summary

| | 🔴 | 🟠 | 🟡 |
| --- | :-: | :-: | :-: |
| Raw findings from the five reviewers (75) | 5 | 23 | 47 |
| **Consolidated findings (this report)** | **1** | **12** | **25** |

Overlaps were merged. For example, five reviewers reported "no logging" or "no rate limit" in different forms. Each consolidated finding lists its sources.

**Verdict:** The branch can merge after the 🟠 items marked "before merge" are fixed. The panel must **not** go on the public internet until the product owner decides 🔴 R1 again with the new facts.

What held up under attack (security reviewer, verified with requests):
- No XSS: the payloads were escaped in content, category, `q` and `next`.
- No SQL injection.
- No open redirect: 7 bypass forms tried.
- CSRF works on every state-changing route.
- No user enumeration by response time: about 0.15 s for known and unknown emails.
- No path traversal.
- Fresh session id on each login, so no session fixation.
- The CLI never takes a password in argv.

## 🔴 Blocking

### R1. A public login with no rate limit and no logging (reopen ADR 0008)

- **Gate:** before public deploy, not before merge.
- **Sources:** devil's advocate 🔴, premortem 🔴, security 🟠, architecture 🟡.
- **Evidence:**
  - `src/app.ts:27` has `Fastify({ logger: false })`. **Reproduced.** A flood of 20 parallel logins left no trace in the server log.
  - `MAX_CONCURRENT_PASSWORD_CHECKS = 4` (`src/admin/routes/session-routes.ts`). scrypt takes about 150 ms, so an attacker can make about 26 guesses per second, about 2.3 million a day.
  - Four slow requests hold all 4 slots, so every real admin gets `503`.
  - The 4 slots are also the whole default libuv thread pool, so static file reads wait.
- **Why it changes the accepted risk:**
  - ADR 0003 uses NIST 800-63B to justify having no composition rules. The same standard (§5.2.2) requires throttling failed attempts.
  - The product owner accepted "attackers can try many passwords". They did not see the cheap admin lockout, or that no attack leaves any record.
  - A compromise leads to hard deletes that cannot be undone (ADR 0006).
- **Recommendation:** put the decision back to the product owner with these facts. The minimum proposal:
  - `@fastify/rate-limit` only on `POST /admin/login`, per IP and per email;
  - the Fastify logger on at `warn` level, with cookie and body redacted;
  - one log line for each login result (normalized email, IP, result) and for each create, update and delete (admin id, joke id).

## 🟠 Worth discussing

| # | Finding | Sources | Evidence | Recommendation | Gate |
| --- | --- | --- | --- | --- | --- |
| O1 | **The HTML panel returns JSON errors and 500s for bad input.** | Architecture, quality, security | **Reproduced:** `?page=1e19` gives a JSON `500 SQLITE_MISMATCH`. `_csrf` sent as a JSON object gives a JSON `500 ERR_INVALID_ARG_TYPE`. A login without `password` gives a JSON `400 FST_ERR_VALIDATION`. `/admin/nope` gives a JSON `404`. There is no `setErrorHandler` or `setNotFoundHandler` in `src/admin/plugin.ts`. | Add HTML error and not-found handlers in the admin plugin. Cap `parsePage`. Treat a non-string `_csrf` as a mismatch. | Before merge |
| O2 | **`npm run dev` does not rebuild the CSS.** The Tailwind watcher stops after the first build. | Devil's advocate (🔴), quality | **Reproduced:** in `sh`, a background job gets a closed stdin, and Tailwind v4 `--watch` exits on stdin `end` (`@tailwindcss/cli/dist/index.mjs`). The watcher was dead after 4 s. Ctrl-C and Windows also do not work. | Use `--watch=always`, or a runner such as `concurrently`. Update ADR 0011. Downgraded from 🔴: development only, a one-word fix, and no user risk. | Before merge |
| O3 | **The production start path needs devDependencies, and `dist/` cannot serve the panel.** | Premortem (🔴), architecture, devil's advocate | `start` is `tsx src/server.ts`, and `tsx`, `@tailwindcss/cli` and `@fontsource/*` are devDependencies (checked). `tsc` does not copy `src/admin/views`. If `admin.css` is missing, the panel shows no error and has no styles. | Choose one path. Either production runs `tsx` (move it to dependencies; drop the `tsc` emit or document it as unused), or production runs `node dist/server.js` (copy the views and change `start`). Fail at start-up when `admin.css` is missing. | Before deploy |
| O4 | **There is no runbook to keep the data safe.** | Premortem (🔴, three stories) | The default `DATABASE_PATH` is inside the checkout (`src/db/connection.ts`), and the file is gitignored. The `db:init` error pushes operators toward `--force`. ADR 0007 says backups are important, but no procedure exists. WAL mode means that a plain `cp` misses recent writes. A CLI run without `DATABASE_PATH` silently creates a new empty database. | Add a production section to the README: a persistent `DATABASE_PATH`, never `--force` in deploy scripts, `sqlite3 … ".backup"` before each deploy. Let the CLI print the database path it uses. | Before deploy |
| O5 | **No security headers on `/admin`.** | Security | **Reproduced:** an authenticated `/admin/jokes` has only `access-control-allow-origin`, `content-type`, `content-length`, `date` and `connection`. There is no CSP, `frame-ancestors`, `nosniff`, `Referrer-Policy` or `Cache-Control: no-store`. | Add an admin-scoped `onSend` hook (or `@fastify/helmet` in the admin plugin). Move the inline counter script to `/admin/assets` so that the CSP can be `default-src 'self'`. | Before deploy |
| O6 | **Session ids and CSRF tokens are in plain text, and the database file is world-readable.** | Security, devil's advocate | `sessions.id` holds the raw cookie value. The file is created with `-rw-r--r--`. Each backup (O4) then contains live bearer tokens. | Store `sha256(sid)` in the same column; this logs everyone out once. Create or `chmod` the database file as `0600`. | Before deploy |
| O7 | **No way to evolve the schema, and ADR 0004 has the wrong classification.** | Architecture, premortem, devil's advocate | `src/db/schema.ts` uses only `CREATE TABLE IF NOT EXISTS`, with no `PRAGMA user_version`. A new column never reaches an existing database. `sessions` can be dropped at any time (it only logs everyone out), so ADR 0004 is reversible. `admins` and `jokes` are the parts that are really hard to change, and they have no ADR. | Add `PRAGMA user_version` and a small ordered-migrations runner before the first production database exists. Reclassify ADR 0004 as reversible and add an ADR for schema evolution. | Before deploy |
| O8 | **Joke ids are reused, which silently changes the public contract.** | Devil's advocate, premortem, architecture | `jokes.id INTEGER PRIMARY KEY` has no `AUTOINCREMENT`. After the highest-id joke is deleted, a new joke gets the same id. Saved public ids and votes then point to a different joke. Spec §1 says the public contract does not change. | Product owner decision: rebuild `jokes` with `AUTOINCREMENT` now, while it is cheap (needs O7), or accept the reuse in the spec. | Decide before deploy |
| O9 | **The list does a full scan of `votes` for each row.** | Architecture | **Reproduced:** `EXPLAIN QUERY PLAN` shows `SCAN votes`. Each list page runs two correlated subqueries per row, that is 40 scans. Anonymous `POST /api/jokes/:id/vote` makes `votes` grow without limit. | `CREATE INDEX IF NOT EXISTS idx_votes_joke_id ON votes(joke_id, vote_type)`. Optionally, change to one grouped `LEFT JOIN`. | Before deploy |
| O10 | **The CLI crashes with a stack trace on a mistyped flag.** | Quality | **Reproduced:** `admin:create --emial x` throws an uncaught `ERR_PARSE_ARGS_UNKNOWN_OPTION`, because `parseArgs` runs outside the `try` block. | Convert `parseArgs` errors into a `CommandFailure` (exit code 1 and the usage line). Add a test. | Before merge |
| O11 | **A pagination test depends on the order of the tests.** | Quality | **Reproduced:** `vitest -t "invalid page"` fails when it runs alone, because only an earlier test creates the 45 jokes. | Create the data in `beforeAll`, or in each test. | Before merge |
| O12 | **No CI, but `AGENTS.md` says that one exists.** | Premortem | `.github/` does not exist (checked). The security tests (CSRF, `next`, expiry) can break and nobody sees it. | Add a GitHub Actions workflow that runs `npm ci && npm test`. | Before deploy |

## 🟡 Warnings

| # | Finding | Source | Recommendation |
| --- | --- | --- | --- |
| Y1 | `app` is built when the module is imported and reads env at that time. There is no `buildApp(options)`, so tests build a second Fastify instance by hand. | Architecture | Export `buildApp({ db, secureCookie, swagger })`. |
| Y2 | Database setup (pragmas, `registerSqlFunctions`, tables) is repeated in `connection.ts` (two times) and `tests/helpers/database.ts`. `lower_text` exists only on those connections. | Architecture, quality | One `openDatabase(path)` used everywhere. |
| Y3 | `adminSession` is declared on every `FastifyRequest`, but it exists only in the admin scope. | Architecture | Make it optional, or use a typed getter. |
| Y4 | The CLI imports from `src/admin/` (`password`, `email`). The routes import a type from `plugin.ts`, which imports the routes. | Architecture | Move them to `src/auth/` and `src/admin/types.ts`. |
| Y5 | Global CORS `*` also applies to `/admin` pages and preflight requests (no credentials, so not exploitable). | Security, architecture | Register CORS only for `/api` and `/health`. |
| Y6 | Login is not CSRF-protected (login CSRF), and the cookie has no `__Host-` prefix. | Security, devil's advocate | Accept it in ADR 0005, or check `Origin`/`Sec-Fetch-Site` on login. |
| Y7 | `category` has no maximum length. A 1 MB category reached `/api/categories` (only an admin can do this). | Security | Add a maximum length (for example 50) in validation and in the schema. |
| Y8 | `@fastify/static` serves dotfiles: `/admin/assets/.gitkeep` returns `200` (**Reproduced**). | Security | `dotfiles: "deny"`. |
| Y9 | Swagger UI is on unless `NODE_ENV=production`, and `npm start` does not set it (this was already true before the branch). | Security | Document it as required, or enable Swagger only when asked. |
| Y10 | The login limit is 4 for each process, which is also the default libuv thread pool size. | Architecture | Make it configurable, and keep it below `UV_THREADPOOL_SIZE`. |
| Y11 | No indexes on `sessions(admin_id)` and `sessions(expires_at)`. Expired sessions are cleaned only on a successful login. | Architecture | Add both indexes together with O9. |
| Y12 | `build:fonts` copies hard-coded file names from `node_modules`. | Architecture, devil's advocate | Pin the fontsource versions exactly. |
| Y13 | `admin:create` checks and then inserts. If two runs race, the user sees a raw `UNIQUE` error. | Architecture | Map `SQLITE_CONSTRAINT_UNIQUE` to the "already exists" failure. |
| Y14 | `Number(params.id)` accepts `0x10`, `1e1` and `" 5 "`. | Quality | Use a params schema with `type: "integer"`, or `/^\d+$/`. |
| Y15 | `/admin` paths and the cookie options are written by hand in many places, although helpers exist (`DEFAULT_ADMIN_PATH`, `loginPath`). | Quality | Use the helpers and one cookie-options constant. |
| Y16 | Small duplications: the category-name mapping (2 times), code-point counting (`password.ts` and `joke-form.ts`), test-local `countJokes`, the error-card and sticker markup in views. | Quality | Extract the helpers and the Eta partials. |
| Y17 | Exports that nothing else uses: `LimitedResult`, `DEFAULT_ADMIN_PATH`, `Pagination`, `MIN_/MAX_PASSWORD_LENGTH`. | Quality | Remove `export`, or use them (Y15). |
| Y18 | Loose types: `JOKE_TYPES` is `string[]`, `JokeWithActivity` repeats most of `JokeWithStats`, an inline delete-impact type, and the magic `LIMIT -1` default. | Quality | `as const` with a `JokeType` union, `Omit<>`, named types. |
| Y19 | Two date formats: `admins.created_at` uses `CURRENT_TIMESTAMP`, and sessions use ISO strings. | Quality | Use one format. |
| Y20 | CLI details: `list` has a different signature, `admin-main.ts` does not close the database, and `readHiddenLine` never ends on Ctrl-D or EOF and calls `process.exit` itself. | Quality | Same signature, close the database, reject on EOF. |
| Y21 | Some tests promise more than they check (the dummy-hash test checks only the call count; the wildcard test does not check the status). Some tests depend on exact markup and class order. | Quality | Assert the arguments and the status. Use `data-*` hooks. |
| Y22 | Query tests are in `tests/unit/admin/`, not next to `db.test.ts`. `sessions.test.ts` shares one database for all its tests. | Quality | Move the files. Use `beforeEach`. |
| Y23 | Escaping depends on the Eta default (`new Eta()`). | Quality | `new Eta({ autoEscape: true })`, and `cache: true` in production. |
| Y24 | scrypt `p=5` costs 5 times the CPU of `p=1` for 16 MiB. `verifyPassword` ignores the `scrypt` prefix. ADR 0003 overstates its irreversibility: the format records the parameters, and there are only a few admins. | Devil's advocate | Check the prefix. Explain in ADR 0003 why `p=5` and not `N=2^17`. |
| Y25 | The README has no environment-variable table, and its "Project Structure" and "Technical Stack" sections still describe Express. | Premortem | Add a table with `DATABASE_PATH`, `COOKIE_SECURE` and `NODE_ENV`, and update the old sections. |

## Corrections to reviewer output

| Reviewer | Claim | Correction |
| --- | --- | --- |
| Premortem | "`COOKIE_SECURE` is missing from the `AGENTS.md` table." | False. It is at `AGENTS.md:64`. Only the README has no environment table (Y25). |
| Quality | Line references `src/db/queries.ts:1398` and `:1448`. | The file has 294 lines. The content of those findings (Y18) is correct; the line numbers are not. |
| Devil's advocate | `npm run dev` watcher, 🔴. | Reproduced and correct, but downgraded to 🟠 (O2): it affects only development and has a one-word fix. |
| Premortem | Deploy and data-loss stories, 🔴. | The evidence is correct. Downgraded to 🟠 (O3, O4), because no deployment exists yet and the spec puts deployment out of scope. They block the first deploy, not the merge. |

## Proposed order

1. **Before merge** (small, local fixes): O1, O2, O10, O11.
2. **Product owner decisions:** R1 (rate limit and logging), O8 (id reuse).
3. **Before the first public deploy:** R1 as decided, O3, O4, O5, O6, O7, O9, O12.
4. **Later, as clean-up:** the 🟡 items, grouped by file.
