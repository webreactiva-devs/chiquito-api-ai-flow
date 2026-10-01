# 0016. Send security headers on all admin responses

- Status: Accepted
- Date: 2026-10-01
- Classification: Reversible

## Context

The Red Team review (O5) and the browser test (D-3) found that `/admin` responses had no security headers. Admin pages could be framed, there was no Content Security Policy as a second defense against XSS, and the browser Back button showed the joke list from the cache after logout.

## Decision

An `onSend` hook in the admin plugin adds these headers to every `/admin` response, including errors and static files:

- `Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'`
- `X-Frame-Options: DENY` (for old browsers)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: same-origin`

HTML responses also get `Cache-Control: no-store`. Static files (CSS, fonts, script) keep the default caching.

The content counter script moved from an inline `<script>` to `src/admin/scripts/content-counter.js`, served under `/admin/assets/`, so the policy does not need `'unsafe-inline'`.

## Consequences

- Views must not use inline scripts, inline event handlers or inline `style` attributes. New scripts go to `src/admin/scripts/`.
- After logout, the Back button loads the page again from the server, and the session guard sends the user to the login page.
- The public API (`/api`, `/health`, `/docs`) does not get these headers.
