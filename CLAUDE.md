# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server with auto-reload (tsx watch)
npm start        # Start production server (tsx)
npm run build    # Compile TypeScript to JavaScript
npm test         # Run all tests
npm run lint     # Run Biome linter
npm run check    # Run Biome checks
npm run format   # Format code with Biome
```

Run a single test by pattern:
```bash
node --import tsx --test tests/app.test.js --test-name-pattern "GET /api/jokes"
```

## Architecture

This is a REST API serving Chiquito de la Calzada jokes using TypeScript and Express.js with ES modules.

**Data flow**: JSON file (`data/chiquito.json`) → loaded at startup in `src/app.ts` → served via Express routes

**Key files**:
- `src/app.ts` - Express app with all routes and business logic (exports app for testing)
- `src/server.ts` - Server initialization only
- `src/types/index.ts` - TypeScript interfaces (Joke, Category, etc.)
- `data/chiquito.json` - Jokes database with `id`, `type`, `content`, `category` fields

## Code Style Requirements

**Mandatory rules from project guidelines**:
- NO inline comments - code must be self-documenting
- All code in English (variables, functions, documentation)
- Use descriptive names instead of comments
- Error messages can include Chiquito references (e.g., "fistro") for consistency

## Testing

Uses Node.js built-in test runner with Supertest. Tests import the app directly from `src/app.js`.

## Technical Notes

- Requires Node.js >= 21.0.0
- CORS enabled without restrictions
- Server runs on PORT env var or 3000
