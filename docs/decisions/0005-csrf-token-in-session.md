# 0005. Protect forms with a CSRF token stored in the session

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

All state-changing admin actions are HTML form posts with a cookie session.

## Decision

Each session has a random `csrf_token`. Every admin form sends it in the hidden field `_csrf`. A hook compares it with `timingSafeEqual` on each `POST` under `/admin`, except the login. On failure, the response is `403`. The cookie also has `SameSite=Lax`.

## Consequences

- No extra dependency or secret.
- A session gets a new token only at login.
