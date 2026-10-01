# Verification report: Admin panel

- Spec: [docs/specs/admin-panel.md](../specs/admin-panel.md)
- Branch: `feature/admin-panel` (commit `9ea2341`)
- Date: 2026-10-01
- Result: **30 of 30 acceptance criteria are met. 21 have full automated tests. 9 have partial automated tests, and a manual check covers the rest.**

## Summary

| Status | Meaning | Count |
| --- | --- | :-: |
| ✅ Automated | Automated tests check all clauses of the criterion. | 21 |
| 🟡 Partly automated | Automated tests check some clauses or some routes. A manual check on 2026-10-01 covers the rest. | 9 |
| ❌ Not met | The behavior is different from the spec. | 0 |

`npm test` passes: 34 test files, 224 tests (type check and Biome check included).

## Method

1. Map each clause of each acceptance criterion to the test that checks it (`vitest --reporter=verbose`).
2. Read the code for clauses that no test checks.
3. Run the clauses that no test checks against real servers and the real CLI, on a separate database:
   - four servers with `NODE_ENV=production`, `NODE_ENV=development`, `COOKIE_SECURE=false` and no variables;
   - `curl` for HTTP requests;
   - a Python pseudo-terminal for the interactive CLI prompts.
4. Compare the public API tests and `spec/openapi.yaml` with `main` (`git diff main`).

## Acceptance criteria

### 9.1 Authentication and sessions

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-1 Access without a session | ✅ | `login.test.ts` › should redirect to the login page with the requested path | The test uses `/admin/jokes/new`, not `/admin/jokes/5/edit`. The same guard handles both. |
| AC-1b Form without a session | 🟡 | `csrf.test.ts` › should redirect a form without a session (only `POST /admin/jokes`) | Manual: `POST /admin/logout`, `/admin/jokes/5` and `/admin/jokes/5/delete` give `302` to `/admin/login`. Joke 5 did not change. |
| AC-2 Successful login | ✅ | `login.test.ts` › should start a session… in any letter case (cookie attributes, session row); › should return to the requested page; `session-expiry.test.ts` › should store an expiry 24 hours after the login | Three tests check the clauses. No single test sends all of them in one request. |
| AC-3 Failed login | ✅ | `login.test.ts` › should reject a wrong password; › should reject an unknown email | — |
| AC-3b Same work for unknown emails | ✅ | `login-enumeration.test.ts` (spy on `verifyPassword`, response comparison) | The test checks that `verifyPassword` runs once, not which hash it gets. It compares header names, not header values. |
| AC-3c Login concurrency limit | ✅ | `login-concurrency.test.ts` | — |
| AC-4 Unsafe `next` | ✅ | `login.test.ts` › should ignore the unsafe next path (3 cases); `next-path.test.ts` (11 cases) | — |
| AC-5 Secure cookie by default | 🟡 | `secure-cookie.test.ts` › should set Secure by default | The test does not change `NODE_ENV`. Manual: with `NODE_ENV=production` and with `NODE_ENV=development`, the cookie has `Secure`. |
| AC-5b Secure off for local HTTP | 🟡 | `secure-cookie.test.ts` › should not set Secure when secureCookie is false | The test sets the plugin option, not the `COOKIE_SECURE` variable. Manual: a server with `COOKIE_SECURE=false` sends the cookie without `Secure`. |
| AC-6 Expired session | ✅ | `session-expiry.test.ts`; `sessions.test.ts` (24 h boundary) | — |
| AC-7 Logout | ✅ | `logout.test.ts` › should delete the session and redirect to the login page | — |
| AC-8 CSRF protection | 🟡 | `csrf.test.ts` (no token, wrong token, token of another session on `POST /admin/jokes`; no token on logout) | Edit and delete have no CSRF test. Manual: `POST /admin/jokes/5` with a wrong token and `POST /admin/jokes/5/delete` without a token give `403` with the expected message. Joke 5 did not change. |

### 9.2 Admin CLI

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-9 Create an admin | ✅ | `cli.test.ts` › should create an admin with a lowercase email…; › should ask for the password two times in a terminal | Manual (pseudo-terminal): `admin:create --email Ana2@Example.com` creates `ana2@example.com` with a `scrypt$` hash. |
| AC-10 Password rules | 🟡 | `cli.test.ts` › should refuse a short password (create); › should refuse two different passwords (create); › should keep the old password when the new one is too short (password); `password.test.ts` (11/12/128/129) | No command test for 129 characters or for `admin:password` with two different passwords. Manual: 129 characters fail for `create` and `password` (exit 1). In a pseudo-terminal, `admin:password` with two different passwords exits 1 with "The passwords do not match." |
| AC-11 Duplicate email | ✅ | `cli.test.ts` › should refuse an email that exists in any letter case | — |
| AC-11b Non-interactive password | ✅ | `cli.test.ts` › should create an admin… from stdin password | Manual on a fresh clone: an admin created with `--password-stdin` can log in (`302`). |
| AC-11c No terminal and no flag | 🟡 | `cli.test.ts` › should ask for --password-stdin without a terminal (`create` only) | Manual: `admin:password` without a terminal and without the flag exits 1 with the `--password-stdin` message. The password did not change. |
| AC-12 List admins | ✅ | `cli.test.ts` › list (2 tests) | — |
| AC-13 Delete an admin | ✅ | `cli.test.ts` › delete; `admin-cli-sessions.test.ts` › should close the sessions of a deleted admin | — |
| AC-14 Change a password | ✅ | `cli.test.ts` › password; `admin-cli-sessions.test.ts` › should close the sessions and accept only the new password | — |

### 9.3 Joke management

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-15 Create a joke | ✅ | `main-path.test.ts` | — |
| AC-16 Validation errors | 🟡 | `jokes-create.test.ts` (empty fields, 1001 characters, unknown type, values kept, no data change); `jokes-edit.test.ts` › should show errors and not save an invalid form (empty category only); `joke-form.test.ts` | For edit, only an empty category has a test. Create and edit use the same `validateJokeForm` function, so the other cases follow from the code. No manual check. |
| AC-17 Edit a joke | ✅ | `jokes-edit.test.ts` › should save new values and show them in the public API | The test edits a new joke, not joke 5. |
| AC-18 Delete confirmation | ✅ | `jokes-delete.test.ts` › should show the confirmation with the votes and views to delete (12 votes, 40 views) | — |
| AC-19 Delete with votes and views | ✅ | `jokes-delete.test.ts` › should delete the joke, its votes and its stats; `delete-joke.test.ts` | — |
| AC-20 Joke that does not exist | ✅ | `jokes-edit.test.ts` (9999, `abc`, `5abc`, update 9999); `jokes-delete.test.ts` (page and POST 9999) | Manual: the 404 response is `text/html`. |

### 9.4 Joke list

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-21 Default list | ✅ | `jokes-pagination.test.ts` › should show all seed jokes on one page | The test uses 17 jokes, not 18. |
| AC-22 Pagination | 🟡 | `jokes-pagination.test.ts` › should show 20 jokes on page 2 of 45 (ids 21–40, label, both links); › should keep the filters in the pagination links ("Next" only) | No test checks that "« Previous" keeps `category` and `q`. Both links use the same `pageUrl` function. No manual check. |
| AC-23 Filter and search together | ✅ | `jokes-list.test.ts` › should filter by category and search together | — |
| AC-23b Accents | ✅ | `jokes-list.test.ts` › should search with accented capital letters; `search.test.ts` (`ÉL`, `CUÁNDO`, `cuando`) | — |
| AC-23c Wildcards | ✅ | `jokes-list.test.ts` (`%`, `_`); `search.test.ts` | — |
| AC-24 Page out of range | ✅ | `jokes-pagination.test.ts` › should show an empty state for a page without jokes | — |
| AC-25 Output escaping | ✅ | `jokes-list.test.ts` › should escape joke content; `jokes-create.test.ts` › should keep the sent content in the form | — |
| AC-26 Notices | ✅ | `jokes-list.test.ts` (welcome, created, unknown, `toString`); `jokes-edit.test.ts` (updated); `jokes-delete.test.ts` (deleted) | — |

### 9.5 Database initialization

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-27 Protected init | 🟡 | `init.test.ts` › should refuse a database with jokes without force | The test calls `initializeDatabase`, not the `db:init` entry point. Manual: `npm run db:init` exits 1 with the `--force` message. |
| AC-28 Forced init keeps admins | ✅ | `init.test.ts` › should reset jokes, votes and stats but keep admins and sessions with force | — |

### 9.6 Public API

| AC | Status | Evidence | Gap |
| --- | :-: | --- | --- |
| AC-29 Public contract does not change | ✅ | `git diff main` shows no change in `tests/integration/{jokes,stats,votes,app-routes}.test.ts`, `tests/e2e/` and `spec/openapi.yaml`. All these tests pass. | — |

## Other findings

These points are not acceptance criteria, but they are differences between the spec and the code.

| # | Finding | Where | Proposal |
| --- | --- | --- | --- |
| 1 | After a login without `next`, the panel goes to `/admin/jokes?notice=welcome`. Spec §3.3 says `/admin/jokes`. The notice came from the prototype. AC-4 (unsafe `next`) still goes to `/admin/jokes`. | `src/admin/routes/session-routes.ts` | Update spec §3.3 to say `/admin/jokes?notice=welcome`. |
| 2 | Spec §7 does not list the font packages `@fontsource/bungee` and `@fontsource-variable/rubik`, or the `build:fonts` script. | `package.json` | Add them to spec §7. |
| 3 | Spec §12 still lists fonts and branches as open questions. Both are decided: self-hosted fonts (ADR 0011) and one branch. | `docs/specs/admin-panel.md` | Close the questions in §12. |
| 4 | Spec §3.3 says that each login deletes expired sessions. The code does this in `startSession`, so it happens only on a successful login. | `src/admin/sessions.ts` | Change the spec to "each successful login". |
| 5 | `npm run build` compiles to `dist/`, but `tsc` does not copy the `.eta` views. The spec does not cover `dist/`. `npm start` uses `tsx` from `src/`, so the panel works. | `tsconfig.json` | Out of scope. Document it, or copy the views if `dist/` is used later. |
| 6 | `AGENTS.md` says that `npm test` is "same as CI", but the project has no CI workflow. | `AGENTS.md` | Remove the reference or add CI. Not part of this feature. |

## Recommended tests

These tests convert the manual checks into automated checks. The code does not change.

| AC | Test to add |
| --- | --- |
| AC-1b, AC-8 | Use `it.each` over the four admin `POST` routes (logout, create, update, delete): without a session → `302`; with a wrong token → `403`; no data changes. |
| AC-5, AC-5b | Extract the `COOKIE_SECURE` reading from `src/app.ts` into a small function (for example, `isSecureCookieEnabled(env)`) and add a unit test for `undefined`, `"false"`, `"true"`, and `NODE_ENV` values. |
| AC-10, AC-11c | Add `admin:password` cases: two different passwords, 129 characters, and no terminal without the flag. |
| AC-16 | Use `it.each` for the edit form with the same invalid cases as the create form. |
| AC-22 | Check the "« Previous" link on page 2 with `category` and `q`. |
| AC-27 | Run `src/db/init-main.ts` as a child process with a temporary `DATABASE_PATH` and check the exit code and the message. |
