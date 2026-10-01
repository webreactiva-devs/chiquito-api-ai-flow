# 0012. English UI and no OpenAPI entries for the admin panel

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The repository writes all code and documentation in English. The `/admin` routes return HTML, not JSON.

## Decision

The panel UI is in English, with Chiquito references in notices and empty states. The `/admin` routes are not in `spec/openapi.yaml`. The README documents them.

## Consequences

- Swagger UI shows only the public JSON API.
