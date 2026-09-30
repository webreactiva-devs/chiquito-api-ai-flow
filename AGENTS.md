# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

REST API serving Chiquito de la Calzada jokes. TypeScript + Fastify 5 + SQLite (better-sqlite3), ES modules, Node.js >= 21.

## Commands

```bash
npm run dev              # Dev server with auto-reload (tsx watch + Tailwind watch, COOKIE_SECURE=false)
npm start                # Run server with tsx (needs the admin CSS from npm run build or build:css)
npm run build            # Build the admin CSS, then compile TypeScript to dist/
npm run build:css        # Copy the admin fonts and build public/admin/admin.css with the Tailwind CLI
npm run admin:create -- --email <email> [--password-stdin] # Also admin:list, admin:delete, admin:password
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

- `src/app.ts` - Builds and exports the Fastify app: CORS, Swagger, the admin plugin, and the joke/vote/stats routes. Tests import it directly.
- `src/admin/` - Admin panel plugin under `/admin`: server-rendered Eta views (`views/`), Tailwind entry (`styles/input.css`), session guard, CSRF check, password hashing, joke form rules and pagination.
- `src/cli/` - Admin CLI. `admin.ts` exports `runAdminCommand(args, io, db)`; `admin-main.ts` is the entry point.
- `src/server.ts` - Starts the server only (`PORT` or 3000).
- `src/db/connection.ts` - Database singleton (WAL, foreign keys on); `getDatabase(":memory:")` for isolated tests.
- `src/db/schema.ts` - Table definitions (`jokes`, `votes`, `stats`, `admins`, `sessions`).
- `src/db/admin-queries.ts` - Queries for admins and sessions.
- `src/db/functions.ts` - SQLite functions (`lower_text`) and the `LIKE` escape helper.
- `src/db/queries.ts` - Typed query functions.
- `src/db/init.ts` - `initializeDatabase`: seeds the database. Refuses a database with jokes unless `force` is set. `src/db/init-main.ts` is the `db:init` entry point.
- `src/types/index.ts` - Shared interfaces.
- `spec/openapi.yaml` - OpenAPI spec, served by Swagger UI at `/docs` (disabled when `NODE_ENV=production`).

**Endpoints**: `/health`, `/api/jokes`, `/api/jokes/random`, `/api/jokes/:id`, `/api/categories`, `/api/stats`, `/api/stats/top`, `POST /api/jokes/:id/vote`, `/api/jokes/:id/votes`. Keep `spec/openapi.yaml` in sync when routes change. The `/admin` routes return HTML and are not in the OpenAPI spec.

**Admin panel**: see `docs/specs/admin-panel.md`, `docs/plans/admin-panel.md` and the ADRs in `docs/decisions/`. Views use `<%= %>` (escaped) for all data; `<%~ %>` is only for the layout body. Write full Tailwind class names in templates.

## Environment variables

| Variable | Default |
| --- | --- |
| `PORT` | `3000` |
| `DATABASE_PATH` | `data/chiquito.db` |
| `NODE_ENV` | `production` disables Swagger |
| `COOKIE_SECURE` | `true`. Set `false` only for local HTTP (`npm run dev` does it) |

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
