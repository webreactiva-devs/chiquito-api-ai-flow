# 0009. Set the Secure cookie attribute by default

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The project has no deployment configuration. If the production environment does not set `NODE_ENV=production`, a cookie that depends on it goes over plain HTTP.

## Decision

The `sid` cookie always has `Secure`. Only `COOKIE_SECURE=false` turns it off. `npm run dev` sets `COOKIE_SECURE=false` for local HTTP.

## Consequences

- Safe default in production.
- Local development over HTTP needs the variable.
