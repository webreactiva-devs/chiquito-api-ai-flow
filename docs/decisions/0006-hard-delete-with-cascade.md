# 0006. Delete jokes with their votes and stats

- Status: Accepted
- Date: 2026-09-30
- Classification: Irreversible

## Context

The `votes` and `stats` tables have foreign keys to `jokes` without `ON DELETE CASCADE`. Thus a joke with votes or views cannot be deleted. Options: hard delete with cascade, soft delete, or no delete for jokes with votes.

## Decision

Delete the rows in `votes`, then `stats`, then `jokes` in one transaction. A confirmation page shows the number of votes and views that the delete removes. No schema migration.

## Consequences

- The public queries do not change.
- Deleted data cannot come back. Each delete is irreversible.
- SQLite can give the id of the last deleted joke to a new joke.
