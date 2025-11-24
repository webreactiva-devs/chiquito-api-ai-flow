# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server with auto-reload (tsx watch)
npm start                # Start production server (tsx)
npm run build            # Compile TypeScript to JavaScript
npm run db:init          # Initialize/reset SQLite database
npm test                 # Run all tests (Vitest)
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests only
npm run lint             # Run Biome linter
npm run check            # Run Biome checks
npm run format           # Format code with Biome
```

Run a single test by pattern:
```bash
npx vitest run -t "should return all jokes"
```

## Architecture

This is a REST API serving Chiquito de la Calzada jokes using TypeScript and Fastify with ES modules.

**Data flow**: SQLite database (`data/chiquito.db`) → queried via `src/db/queries.ts` → served via Fastify routes

**Key files**:
- `src/app.ts` - Fastify app with all routes and business logic (exports app for testing)
- `src/server.ts` - Server initialization only
- `src/types/index.ts` - TypeScript interfaces (Joke, Category, etc.)
- `src/db/connection.ts` - Database connection singleton
- `src/db/schema.ts` - Table definitions
- `src/db/queries.ts` - Typed query functions
- `src/db/init.ts` - Database initialization script
- `data/chiquito.json` - Seed data for database initialization

**Database tables**:
- `jokes` - id (INTEGER PRIMARY KEY), type (TEXT), content (TEXT), category (TEXT)

## Code Style Requirements

**Mandatory rules from project guidelines**:
- NO inline comments - code must be self-documenting
- All code in English (variables, functions, documentation)
- Use descriptive names instead of comments
- Error messages can include Chiquito references (e.g., "fistro") for consistency

## Testing

Uses Vitest with Fastify's inject() for HTTP testing. Testing trophy structure:
- `tests/unit/` - Unit tests for isolated functions
- `tests/integration/` - Integration tests for API endpoints
- `tests/e2e/` - End-to-end tests for complete user flows

Tests import the app directly from `src/app.ts`.

## Technical Notes

- Requires Node.js >= 21.0.0
- CORS enabled without restrictions
- Server runs on PORT env var or 3000
