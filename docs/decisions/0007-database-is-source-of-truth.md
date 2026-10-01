# 0007. Make SQLite the source of truth and protect db:init

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

`npm run db:init` dropped all tables and loaded `data/chiquito.json` again. Changes from the panel would be lost.

## Decision

After the first load, SQLite is the source of truth. `db:init` fails if `jokes` has rows. `db:init --force` resets `jokes`, `votes` and `stats` only. It keeps `admins` and `sessions`.

## Consequences

- `data/chiquito.json` is only seed data. Jokes created in the panel are not in git.
- A backup of the database file is now important.
