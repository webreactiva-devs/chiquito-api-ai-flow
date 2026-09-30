# 0014. Validate the login next path with URL parsing

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

After login, the admin goes to `next` only if it is a local path under `/admin/`. A prefix check on the raw string accepts values like `/admin/../api/jokes`.

## Decision

Parse `next` with `new URL(next, "http://admin.local")`. Accept it only if the origin does not change and the normalized path starts with `/admin/`. Redirect to the normalized path and query. In all other cases, redirect to `/admin/jokes`.

## Consequences

- `//evil.example`, `https://evil.example`, `javascript:` values and `/admin/../api` go to the joke list.
- The guard adds `next` only for `GET` requests. A form sent without a session goes to the plain login page.
