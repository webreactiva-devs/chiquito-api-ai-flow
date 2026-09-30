# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

REST API serving Chiquito de la Calzada jokes. TypeScript + Fastify 5 + SQLite (better-sqlite3), ES modules, Node.js >= 21.

## Commands

```bash
npm run dev              # Dev server with auto-reload (tsx watch)
npm start                # Run server with tsx
npm run build            # Compile TypeScript to dist/
npm run db:init          # Seed an empty SQLite database from data/chiquito.json
npm run db:init -- --force # Reset jokes, votes and stats (keeps admins and sessions)
npm test                 # Type check + Biome check + all Vitest tests (same as CI)
npm run test:types       # tsc --noEmit
npm run test:unit        # tests/unit
npm run test:integration # tests/integration
npm run test:e2e         # tests/e2e
npm run test:coverage    # Vitest with v8 coverage
npm run lint             # Biome lint
npm run check            # Biome check (lint + format + imports)
npm run format           # Biome format --write
```

Run a single test by name:

```bash
npx vitest run -t "should return all jokes"
```

## Architecture

**Data flow**: `data/chiquito.db` (SQLite, gitignored) → typed queries in `src/db/` → Fastify routes.

- `src/app.ts` - Builds and exports the Fastify app: CORS, Swagger, and the joke/vote/stats routes. Tests import it directly.
- `src/server.ts` - Starts the server only (`PORT` or 3000).
- `src/db/connection.ts` - Database singleton (WAL, foreign keys on); `getDatabase(":memory:")` for isolated tests.
- `src/db/schema.ts` - Table definitions (`jokes`, `votes`, `stats`).
- `src/db/queries.ts` - Typed query functions.
- `src/db/init.ts` - `initializeDatabase`: seeds the database. Refuses a database with jokes unless `force` is set. `src/db/init-main.ts` is the `db:init` entry point.
- `src/types/index.ts` - Shared interfaces.
- `spec/openapi.yaml` - OpenAPI spec, served by Swagger UI at `/docs` (disabled when `NODE_ENV=production`).

**Endpoints**: `/health`, `/api/jokes`, `/api/jokes/random`, `/api/jokes/:id`, `/api/categories`, `/api/stats`, `/api/stats/top`, `POST /api/jokes/:id/vote`, `/api/jokes/:id/votes`. Keep `spec/openapi.yaml` in sync when routes change.

## Environment variables

| Variable | Default |
| --- | --- |
| `PORT` | `3000` |
| `DATABASE_PATH` | `data/chiquito.db` |
| `NODE_ENV` | `production` disables Swagger |

## Code style

- No inline comments; code must be self-documenting through descriptive names.
- Write all code, documentation, specs, plans, ADRs, commits and pull requests in English. Use ASD-STE100 Simplified Technical English.
- Error messages may include Chiquito references (e.g. "fistro").
- Biome: tabs, double quotes, organized imports. Run `npm run check` before finishing.
- ESM imports use the `.js` extension for local TypeScript files (`NodeNext` resolution).

## Testing

Vitest with Fastify `inject()` for HTTP tests, following a testing trophy:

- `tests/unit/` - Isolated functions (queries, connection, init).
- `tests/integration/` - API endpoints.
- `tests/e2e/` - Complete user flows.

Add or update tests with every behavior change. `npm test` must pass; it is what CI runs (`.github/workflows/ci.yml`).

## Git

- Use one branch for each feature. Start the branch name with `feature/`, e.g. `feature/categories-endpoint`.
- Make small, atomic commits. One commit contains one logical change.
- Use Conventional Commits with gitmoji, e.g. `feat(api): 🎉 add categories endpoint`.
- Do not add agent signatures or `Co-Authored-By` trailers to commits.

## Scratch files

Put temporary working documents (notes, drafts, analysis) in `.scratchpad/`. Git ignores this folder. Do not put files there that must stay after the session.
