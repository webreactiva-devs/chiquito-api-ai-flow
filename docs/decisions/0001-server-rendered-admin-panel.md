# 0001. Serve the admin panel as server-rendered HTML

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The project is a JSON API with no frontend. Admins need a web panel to manage jokes. Options: HTML rendered by the same Fastify app, an admin JSON API with a separate SPA, or an admin JSON API only (used through Swagger UI).

## Decision

Render HTML pages in the same Fastify app under `/admin`. Use `@fastify/view` with Eta templates. Eta escapes output by default.

## Consequences

- One app and one deployment.
- Tests use `app.inject()` like the rest of the project.
- Forms work without JavaScript.
- A future SPA can reuse the typed queries in `src/db/`. The change costs a rewrite of the views and routes, not of the data layer.
