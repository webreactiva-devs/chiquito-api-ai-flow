# 0010. Search joke content with Unicode lowercase

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

SQLite `LIKE` ignores case only for ASCII letters. Joke content is in Spanish with accented letters.

## Decision

Register a SQLite function `lower_text` with better-sqlite3 that returns `value.toLowerCase()`. Compare `lower_text(content)` with the lowercase search text through `LIKE ... ESCAPE '\'`. Escape `%`, `_` and `\` in the search text. The search is accent-sensitive.

## Consequences

- `ÉL` finds `él`. `clasico` does not find `clásico`.
- The function runs for each row. This is acceptable for a small table.
