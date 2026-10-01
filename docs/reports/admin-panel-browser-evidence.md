# Admin panel: browser evidence report

## 1. Header

| Item | Value |
| --- | --- |
| Date | 2026-10-01 |
| Branch / commit | `feature/admin-panel` / `9ea2341` |
| Spec | `docs/specs/admin-panel.md` (§3, §4, §9) |
| Server | `http://localhost:3960`, `COOKIE_SECURE=false`, own SQLite database (17 seed jokes at start) |
| Browser | Google Chrome 154.0.0.0 (macOS), from the user agent string |
| Tool | Chrome DevTools MCP through its CLI (`chrome-devtools`, version 1.1.1) |
| Viewports | 1280 × 900 (window resize). 375 × 812 (device emulation, because the Chrome window cannot be narrower than 500 px) |
| Admins | `ana@example.com`, `bea@example.com` |

Screenshots are in [`evidence/browser/`](evidence/browser/). Status codes and headers come from the DevTools network panel (`list_network_requests`, `get_network_request`).

## 2. Summary

| Result | Count |
| --- | --- |
| ✅ Pass | 21 |
| ❌ Fail | 0 |
| ⚠️ Partly tested | 2 |
| ➖ Not browser-testable | 14 |
| **Total criteria** | **37** |

No acceptance criterion failed. I found 3 defects worth discussing (🟠) and 9 warnings (🟡). See [§5](#5-defects-found).

## 3. Acceptance criteria

| AC | Result | What I did as a user | Evidence | Notes |
| --- | --- | --- | --- | --- |
| AC-1 | ✅ Pass | Opened `/admin/jokes/5/edit` in a new tab with no session. | [01](evidence/browser/01-login-redirect-deep-link.png). Network: `GET /admin/jokes/5/edit` → `302`, `location: /admin/login?next=%2Fadmin%2Fjokes%2F5%2Fedit`. | The login form has a hidden `next=/admin/jokes/5/edit`. |
| AC-1b | ⚠️ Partly | Tab A and tab B were logged in as ana. I filled the create form in tab B, logged out in tab A, then clicked "Create joke" in tab B. | [28](evidence/browser/28-second-tab-post-after-logout-redirect.png). Network: `POST /admin/jokes` → `302` to `/admin/login`. Database: 0 rows with that content. | I tested only the create POST without a session. I did not test edit, delete and logout POSTs without a session. See defect D-8 (no message, typed data is lost). |
| AC-2 | ✅ Pass | Typed `ANA@Example.COM` and the correct password on the login page from AC-1. | [03](evidence/browser/03-login-uppercase-email-returns-to-deep-link.png). Network: `POST /admin/login` → `302`, `location: /admin/jokes/5/edit`, `set-cookie: sid=…; Path=/admin; HttpOnly; SameSite=Lax`. Database: session `expires_at` = `created_at` + 24 h (`17:58:22.367Z` → next day `17:58:22.367Z`). | The cookie has no `Max-Age`, so it is a browser-session cookie. |
| AC-3 | ✅ Pass | Typed `ana@example.com` with a wrong password. Then typed `ghost@example.com` with a password. | [02](evidence/browser/02-login-wrong-password.png). Network: both `POST /admin/login` → `401`, no `set-cookie` header. Page shows "Invalid email or password." and the email field keeps the typed value. | Supplementary curl check: both 401 responses have the same headers; body length differs only by the echoed email. |
| AC-3b | ➖ | — | — | Needs server-side timing and scrypt call counts. Not observable in a browser. |
| AC-3c | ➖ | — | — | Needs 4 concurrent password checks at the same time. Not practical from one browser. |
| AC-4 | ✅ Pass | Opened `/admin/login?next=…` with `https://evil.example`, `//evil.example`, `/api/jokes` and `/\evil.example`, and logged in as bea each time. | [22](evidence/browser/22-unsafe-next-https-evil-goes-to-jokes.png). Network: each `POST /admin/login` → `302`, `location: /admin/jokes`. | Control: `next=/admin/jokes?page=2` and `next=/admin/jokes/5/delete` redirect to those paths. |
| AC-5 | ➖ | — | — | This server runs with `COOKIE_SECURE=false`. The `Secure` default cannot be seen here. |
| AC-5b | ✅ Pass | Logged in (AC-2). | Network: `set-cookie` has no `Secure` attribute. | — |
| AC-6 | ✅ Pass | Logged in as ana. **Setup:** set ana's `expires_at` to `2000-01-01` with `sqlite3`. Then opened `/admin/jokes/5/edit`. | [29](evidence/browser/29-expired-session-redirect.png). Network: `GET /admin/jokes/5/edit` → `302`, `location: /admin/login?state=expired&next=%2Fadmin%2Fjokes%2F5%2Fedit`. Page: "Your session expired. Log in again." Database: ana has 0 session rows after the request. | The response does not clear the `sid` cookie (defect D-12). |
| AC-7 | ✅ Pass | Clicked "Log out" in the header. | [26](evidence/browser/26-logout-loggedout-state.png). Network: `POST /admin/logout` → `302`, `location: /admin/login?state=loggedout`, `set-cookie: sid=; Max-Age=0`. Database: 0 sessions for ana. curl with the old `sid` → `302` to `/admin/login?next=%2Fadmin%2Fjokes`. | Page shows "You logged out. Hasta luego, Lucas!". The browser Back button still shows the old page from cache (defect D-3). |
| AC-8 | ⚠️ Partly | On the create form, I removed the hidden `_csrf` field with DevTools and clicked "Create joke". Then I put bea's token (from her isolated tab) into ana's form and submitted. | [21](evidence/browser/21-csrf-missing-token-403.png). Network: both `POST /admin/jokes` → `403`. Page: "Your form expired. Go back and try again." Database: 0 rows with the probe content. | I tested only the create form. I did not tamper with the edit, delete and logout forms. |
| AC-9 | ➖ | — | — | CLI criterion. |
| AC-10 | ➖ | — | — | CLI criterion. |
| AC-11 | ➖ | — | — | CLI criterion. |
| AC-11b | ➖ | — | — | CLI criterion. |
| AC-11c | ➖ | — | — | CLI criterion. |
| AC-12 | ➖ | Ran `admin:list` with this server's `DATABASE_PATH` (read only). | Output: `1 ana@example.com 2026-10-01 17:56:42` and `2 bea@example.com 2026-10-01 17:56:42`. No hash. | CLI criterion. Supplementary check only. |
| AC-13 | ➖ | — | — | CLI criterion. |
| AC-14 | ➖ | — | — | CLI criterion. |
| AC-15 | ✅ Pass | Clicked "+ New joke", chose type `joke`, category `absurdo`, typed content, clicked "Create joke". | [10](evidence/browser/10-notice-created.png). Network: `POST /admin/jokes` → `302` to `/admin/jokes?notice=created`. `GET /api/jokes/18`, `/19`, `/20` return the new jokes. | The new ids were 18 to 21. |
| AC-16 | ✅ Pass | Create form: category with spaces only; empty category plus 1001-character content. Edit form: content with spaces only; type changed to `riddle` with DevTools. | [05](evidence/browser/05-validation-category-spaces-only.png), [08](evidence/browser/08-validation-two-errors-1001.png), [12](evidence/browser/12-edit-validation-empty-content.png). Network: each POST → `400`. | The form keeps the sent values and shows one message per field ("Category is required.", "Content must be 1000 characters or fewer.", "Content is required.", "Type must be phrase or joke."). Public API showed no change. |
| AC-17 | ✅ Pass | Opened joke 21 from page 2 of the list, changed type to `joke`, category to `  familia  `, content to `¿Cuándo es él?`, clicked "Save changes". | [13](evidence/browser/13-edit-saved-notice-updated.png). Network: `POST /admin/jokes/21` → `302` to `/admin/jokes?notice=updated`. `GET /api/jokes/21` returns the new values, category trimmed to `familia`. | I used joke 21, not joke 5, to keep seed data intact. |
| AC-18 | ✅ Pass | **Setup:** 9 up votes, 3 down votes and 40 views on joke 12 with curl. Clicked "Delete" on joke 12 in the list. | [23](evidence/browser/23-delete-confirmation-12-votes-40-views.png). | Page shows content, `JOKE` and `comparaciones`, and "This also deletes 12 votes and 40 views. You cannot undo this." |
| AC-19 | ✅ Pass | Clicked "Delete joke" on the confirmation page. | [24](evidence/browser/24-deleted-notice.png). Network: `POST /admin/jokes/12/delete` → `302` to `/admin/jokes?notice=deleted`. Database: 0 rows for joke 12 in `jokes`, `votes`, `stats`. `GET /api/jokes/12` → `404`. | — |
| AC-20 | ✅ Pass | Opened `/admin/jokes/9999/edit` and `/admin/jokes/9999/delete`. Sent update and delete POSTs for 9999 from the page (fetch with a valid `_csrf`). | [19](evidence/browser/19-joke-9999-not-found.png). Network: all four → `404`. | Page: "Joke not found, fistro". `abc`, `1.5` and `0` as ids also give `404`. |
| AC-21 | ✅ Pass | Opened `/admin/jokes` after login. | [04](evidence/browser/04-default-list-1280.png). 17 rows, ids 1 to 17 ascending, "Page 1 of 1 (17 jokes)". "« Previous" and "Next »" are `<span aria-disabled="true">`. | This database has 17 seed jokes, not 18. The behavior matches the criterion. |
| AC-22 | ✅ Pass | **Setup:** created 24 jokes with form posts from the page (45 in total). Clicked "Next »" on page 1. | [16](evidence/browser/16-pagination-page-2-of-3.png). Rows 21 to 40, "Page 2 of 3 (45 jokes)", links `?page=1` and `?page=3`. | With filters, links keep `category` and `q` (see AC-23 and edge case E-17). |
| AC-23 | ✅ Pass | Chose `clásico`, typed `FISTRO`, clicked "Filter". Also opened `?category=clásico&q=fistro`. | [17](evidence/browser/17-filter-search-page2-kept.png). Only `clásico` jokes with "fistro": "Page 1 of 2 (26 jokes)". | The select shows `clásico` and the search box shows the typed text. |
| AC-23b | ✅ Pass | Searched `ÉL`, `CUÁNDO` and `cuando`. | [14](evidence/browser/14-search-uppercase-accent-EL.png). `ÉL` → joke 21 only. `CUÁNDO` → joke 21. `cuando` → 0 jokes. | — |
| AC-23c | ✅ Pass | Searched `%`, `_` and `\`. | [15](evidence/browser/15-search-percent-literal-no-results.png). Each → 0 jokes. | See D-5 about the empty-state text. |
| AC-24 | ✅ Pass | Opened `?category=familia&q=zzz&page=4`. | Page shows "No jokes on this page." and a "Go to page 1" link to `?category=familia&q=zzz&page=1`. | Pagination text reads "Page 4 of 1 (0 jokes)" (D-5). |
| AC-25 | ✅ Pass | Created jokes with `<script>alert('fistro')</script>` and `"><img src=x onerror=alert(1)>`. Opened the list, edit and delete pages of both. | [11](evidence/browser/11-xss-payloads-rendered-as-text.png). Raw HTML contains `&lt;script&gt;` and `&quot;&gt;&lt;img`, and does not contain `<script>alert` or `<img src=x`. | No dialog. Console: no messages. `document.images.length` = 0 on all pages. |
| AC-26 | ✅ Pass | Opened `?notice=created`, `updated`, `deleted`, `bogus` and `<b>x</b>`. | [10](evidence/browser/10-notice-created.png), [13](evidence/browser/13-edit-saved-notice-updated.png), [24](evidence/browser/24-deleted-notice.png). | "Joke created.", "Joke updated.", "Joke deleted, with its votes and views." Unknown values show no notice. |
| AC-27 | ➖ | — | — | `db:init` is a CLI command. |
| AC-28 | ➖ | — | — | `db:init --force` is a CLI command. |
| AC-29 | ➖ | — | — | Test suite, not a browser flow. |

## 4. Edge cases

| # | Case | Result | Expected | Actual | Evidence |
| --- | --- | --- | --- | --- | --- |
| E-1 | Login with uppercase email `ANA@Example.COM` | ✅ | Login works | `302` to `next`, session for ana | [03](evidence/browser/03-login-uppercase-email-returns-to-deep-link.png) |
| E-2 | Wrong password keeps the email | ✅ | Email stays in the field | `value="ana@example.com"`, password field empty | [02](evidence/browser/02-login-wrong-password.png) |
| E-3 | `next=https://evil.example` typed in the URL | ✅ | Go to `/admin/jokes` | `302` `location: /admin/jokes` | [22](evidence/browser/22-unsafe-next-https-evil-goes-to-jokes.png) |
| E-4 | `next=//evil.example` typed in the URL | ✅ | Go to `/admin/jokes` | `302` `location: /admin/jokes` | Network |
| E-5 | Deep link without session, then log in | ✅ | Return to the deep link | Returned to `/admin/jokes/5/edit` | [01](evidence/browser/01-login-redirect-deep-link.png), [03](evidence/browser/03-login-uppercase-email-returns-to-deep-link.png) |
| E-6 | Double-submit the create form (double click; also two clicks 30 ms apart) | ✅ | One joke | One `POST` reached the server each time. One row created. | Database |
| E-7 | Back button after logout | 🟠 | Page is not shown, or is reloaded and redirects to login | Back shows the full joke list and "Signed in as ana@example.com" from the browser cache. No request reaches the server. Reload then redirects to login. Repeated once: same result. | [27](evidence/browser/27-back-after-logout-cached-list.png) |
| E-8 | Edit a joke, then click "Cancel" | ✅ | No change | Went to `/admin/jokes`. API shows the old content. No "unsaved changes" prompt. | API |
| E-9 | Delete, then Back, then submit the delete form again | ✅ | No crash, clear message | Back shows the cached confirmation page. Submit → `404` "Joke not found, fistro". | [25](evidence/browser/25-back-resubmit-delete-404.png) |
| E-10 | Search `ÉL` | ✅ | Finds "él" | Joke 21 | [14](evidence/browser/14-search-uppercase-accent-EL.png) |
| E-11 | Search `%` and `_` | ✅ | No jokes | 0 jokes | [15](evidence/browser/15-search-percent-literal-no-results.png) |
| E-12 | Search with 300 characters | ✅ | No error | `200`, 0 jokes, the input keeps all 300 characters | Network |
| E-13 | Filter + search + pagination, then Next and Previous | ✅ | Filters kept | `?category=clásico&q=FISTRO&page=2` and back to `page=1`; select and input keep the values | [17](evidence/browser/17-filter-search-page2-kept.png) |
| E-14 | `?page=0`, `?page=abc`, `?page=-1`, `?page=1.5` | ✅ | Page 1 | Page 1, `200` | Network |
| E-15 | `?page=1e19` | ❌ | Page out of range or page 1 | `500` with JSON `{"code":"SQLITE_MISMATCH","message":"datatype mismatch"}`. `1e18` also gives `500`. `1e17` gives `200`. Repeated: same result. | [18](evidence/browser/18-defect-page-1e19-500.png) |
| E-16 | `/admin/jokes/abc/edit` | ✅ | 404 | `404` "Joke not found, fistro" page | Network |
| E-17 | `/admin/does-not-exist` (logged in) | 🟡 | 404 page in the panel style | `404` with raw Fastify JSON | [20](evidence/browser/20-admin-unknown-route-json-404.png) |
| E-18 | `<script>alert('fistro')</script>` and `"><img src=x onerror=alert(1)>` | ✅ | Shown as text, no dialog | Shown as text, no dialog, console empty | [11](evidence/browser/11-xss-payloads-rendered-as-text.png) |
| E-19 | Content of exactly 1000 characters | ✅ | Counter "1000 / 1000", normal color | As expected | [06](evidence/browser/06-counter-1000-chars.png) |
| E-20 | Content of 1001 characters | ✅ | Counter in danger color, server rejects | "1001 / 1000" in deep tomato `rgb(184, 40, 27)`; server `400` | [07](evidence/browser/07-counter-1001-chars.png), [08](evidence/browser/08-validation-two-errors-1001.png) |
| E-21 | Emoji in content | ✅ | Counter and server agree | `😀` counts 1. 999 × `a` + `😀` shows "1000 / 1000" and the server accepts it (joke 18). `👨‍👩‍👧` counts 5 (code points, not graphemes). | [09](evidence/browser/09-counter-999-plus-emoji.png) |
| E-22 | Category with spaces only | ✅ | "Category is required." | `400`, message shown | [05](evidence/browser/05-validation-category-spaces-only.png) |
| E-23 | Keyboard only: login form | ✅ | Logical Tab order, visible focus | Email → Password → Log in → Enter logs in. Focus is visible. Inputs use a mustard ring, not a navy outline (D-7). | [30](evidence/browser/30-keyboard-focus-login-email.png), [31](evidence/browser/31-keyboard-focus-login-button.png) |
| E-24 | Keyboard only: list | ✅ | Logical Tab order, visible focus | Logo → Log out → + New joke → Category → Search → Filter → Edit 1 → Delete 1 → Edit 2 … All have a visible focus. Links have accessible names "Edit joke N" / "Delete joke N". | [32](evidence/browser/32-keyboard-focus-list-edit-link.png) |
| E-25 | Layout at 1280 px | ✅ | No horizontal page scroll | `scrollWidth` = `clientWidth` = 1280 | [04](evidence/browser/04-default-list-1280.png) |
| E-26 | Layout at 375 px | 🟠 | Only the table card scrolls | Forms, login, edit and delete pages fit. The **list page scrolls horizontally** (`scrollWidth` 1080, `window.scrollTo(400,0)` works). Repeated: same result. | [33](evidence/browser/33-layout-375-list.png), [34](evidence/browser/34-defect-375-page-scrolls-horizontally.png) |
| E-27 | Dismiss a notice | ✅ | Notice goes away | "✕" link goes to `/admin/jokes` without `notice` | [10](evidence/browser/10-notice-created.png) |
| E-28 | Two tabs: log out in one, act in the other | 🟡 | Action is refused | `POST` → `302` to `/admin/login`, no data change. No `next`, no message; the typed content is lost (D-8). | [28](evidence/browser/28-second-tab-post-after-logout-redirect.png) |
| E-29 | Unknown category in the URL (`?category=nonexistent`) | 🟡 | Clear state | List is empty but the select shows "All" (D-6) | Network/DOM |

## 5. Defects found

No defect is 🔴 blocking.

### D-1 🟠 Very large `page` value gives a 500 error

- Steps: log in. Open `/admin/jokes?page=1e19` (or `?page=99999999999999999999`, or `?page=1e18`).
- Expected: a normal page (out-of-range state or page 1), like `?page=4`.
- Actual: `500` with the raw JSON body `{"statusCode":500,"code":"SQLITE_MISMATCH","error":"Internal Server Error","message":"datatype mismatch"}`. The SQLite error code goes to the user. `?page=1e17` still works.
- Evidence: [18](evidence/browser/18-defect-page-1e19-500.png). Repeated two times.

### D-2 🟠 At 375 px the joke list page scrolls horizontally

- Steps: set the viewport to 375 × 812. Open `/admin/jokes`. Scroll to the right.
- Expected (§6): "On small screens, the table scrolls horizontally inside its card." The page does not scroll.
- Actual: `document.documentElement.scrollWidth` is 1080. The page scrolls 400 px to the right and shows an empty cream area. Cause found in the DOM: the `span.sr-only` elements ("joke 1", "joke 2", …) inside the Edit and Delete links have `position: absolute`. Their containing block is outside the `overflow-x-auto` wrapper, so the wrapper does not clip them and they extend the page to `right = 1080`.
- Evidence: [33](evidence/browser/33-layout-375-list.png), [34](evidence/browser/34-defect-375-page-scrolls-horizontally.png). Repeated with and without the mobile emulation flag.

### D-3 🟠 Back button after logout shows admin data from the cache

- Steps: log in, open the list, click "Log out", press the browser Back button.
- Expected: no admin content after logout (for example, `Cache-Control: no-store` on `/admin` pages).
- Actual: the full list and "Signed in as ana@example.com" appear. No request reaches the server. A reload then redirects to login. The admin HTML responses have no `Cache-Control` header. This matters on a shared computer. The same cache shows a stale delete page (E-9).
- Evidence: [27](evidence/browser/27-back-after-logout-cached-list.png). Repeated once (forward, then back again).

### D-4 🟡 Unknown `/admin` route returns raw JSON

- Steps: log in. Open `/admin/does-not-exist`.
- Expected: an HTML 404 page in the panel style, like "Joke not found".
- Actual: `404` with `{"message":"Route GET:/admin/does-not-exist not found","error":"Not Found","statusCode":404}`.
- Evidence: [20](evidence/browser/20-admin-unknown-route-json-404.png).

### D-5 🟡 Confusing empty-state and pagination text

- Steps: search `%` (0 results). Also open `?category=familia&q=zzz&page=4`.
- Expected: a "no results" message for an empty search on page 1.
- Actual: page 1 shows "No jokes on this page." and a "Go to page 1" link to the same page. The bar shows "Page 1 of 1 (0 jokes)". For page 4 the bar shows "Page 4 of 1 (0 jokes)". The behavior agrees with AC-24, but the text can confuse a user.
- Evidence: [15](evidence/browser/15-search-percent-literal-no-results.png).

### D-6 🟡 Unknown category: select shows "All" but the list is filtered

- Steps: open `/admin/jokes?category=nonexistent`.
- Expected: the select shows the active filter, or the filter is ignored.
- Actual: the list is empty (filter applied), but the select shows "All". The "Go to page 1" link keeps `category=nonexistent`.
- Evidence: DOM check (`select.value = ""`, 0 rows).

### D-7 🟡 Focus style of text fields differs from §6

- Steps: press Tab on the login page or the list filters.
- Expected (§6): "Visible 3 px navy outline on every interactive element."
- Actual: buttons and links have a 3 px navy outline. Inputs and the select have `outline: none` and a 4 px mustard ring (`box-shadow 0 0 0 4px #F2B705`). Focus is visible, but mustard on white has low contrast.
- Evidence: [30](evidence/browser/30-keyboard-focus-login-email.png), [32](evidence/browser/32-keyboard-focus-list-edit-link.png).

### D-8 🟡 Form submitted after logout loses the data without a message

- Steps: open the create form in tab B and type content. Log out in tab A. Click "Create joke" in tab B.
- Expected: no data change (met). A message or a `next` back to the form would help the user.
- Actual: `302` to `/admin/login` with no `next` and no message. The typed content is lost. AC-1b allows this.
- Evidence: [28](evidence/browser/28-second-tab-post-after-logout-redirect.png).

### D-9 🟡 Login without `next` goes to `/admin/jokes?notice=welcome`

- Spec §3.3 says "Otherwise to `/admin/jokes`". The app adds `?notice=welcome` ("Welcome back, pecador."). `docs/plans/admin-panel.md` plans this. With an unsafe `next`, the redirect is exactly `/admin/jokes` (AC-4 passes). Only a spec wording difference.

### D-10 🟡 `access-control-allow-origin: *` on admin HTML responses

- Every `/admin` response, including `POST /admin/login`, has `access-control-allow-origin: *` from the global CORS setup. Browsers do not send cookies with a wildcard origin, so the risk is low. The panel does not need CORS.

### D-11 🟡 A new login does not end the previous session in the same browser

- Steps: log in as bea 6 times in one browser profile.
- Actual: 6 session rows for bea remain valid until expiry. The browser keeps only the last cookie. Not a spec violation.

### D-12 🟡 Expired-session redirect does not clear the cookie

- AC-6 passes and the server deletes the row. The `302` has no `set-cookie` to clear `sid`, so the browser keeps sending a dead cookie until the next login. No security effect.

Other observations (not defects): `GET /admin/login` with a valid session shows the login form instead of a redirect to the list. The app has no client-side guard against double submit; Chrome itself sent only one POST in E-6.

## 6. Limits of this test run

- CLI criteria (AC-9 to AC-14, AC-11b, AC-11c), `db:init` (AC-27, AC-28) and the test suite (AC-29) are outside the browser. I ran only `admin:list` (read only) on this database.
- AC-3b (timing, scrypt call count) and AC-3c (4 concurrent verifications) need server instrumentation or concurrent load.
- AC-5 needs a server without `COOKIE_SECURE=false`.
- AC-1b and AC-8: I tested only the create form. Edit, delete and logout POSTs without session or token were not tested in the browser.
- Some preconditions came from setup, not from the UI: votes and views on joke 12 (curl), the expired session (`sqlite3 UPDATE ... WHERE admin_id=1`), 24 extra jokes (form posts from the page with `fetch`), the invalid `type` and the missing or foreign `_csrf` (DevTools DOM edits), and POSTs to joke 9999 (`fetch`).
- The 375 px tests use device emulation, because the Chrome window has a minimum width of 500 px. I did not test on a real phone or touch input.
- Only Chrome 154 was tested. No Firefox or Safari. Back/forward cache behavior (D-3) can differ between browsers.
- No screen reader test. Accessibility checks were limited to Tab order, focus style and accessible names in the DevTools accessibility tree.
- The test changed this server's database: jokes 18 to 46 created (one is "CSRF probe no token", created by my first probe that removed the wrong token field), joke 21 edited, joke 12 deleted with its votes and views, and several sessions created for bea.

## Verification by the main session

The main session checked the new defects again after the test run (2026-10-01, same server, headless Chrome through puppeteer):

- **D-2 confirmed.** At a 375 px viewport, after login, `document.documentElement.scrollWidth` on `/admin/jokes` is `1080`. Screenshot 34 shows only the empty right part of the page and a scrollbar. Use screenshot 33 and this measurement as the evidence.
- **D-3 confirmed.** The response of `GET /admin/jokes` has no `Cache-Control` header. Screenshot 27 shows the cached list after logout.
- **"CSRF probe no token" joke (limits section).** This joke is not a CSRF bypass. The first probe removed the `_csrf` field of the logout form, not of the create form, so the create form sent a valid token. Requests without a token or with a token of another session got `403` (screenshot 21, and the manual `curl` checks in `admin-panel-verification.md`).
- D-1, D-4, D-9 and D-10 are the same as findings O1, O1, "Other findings #1" and Y5 in `admin-panel-red-team.md` and `admin-panel-verification.md`.
