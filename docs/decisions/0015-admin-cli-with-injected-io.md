# 0015. Run admin CLI commands with injected input, output and database

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The admin CLI reads passwords from a terminal without echo or from standard input. Tests must run the commands without a real terminal and without the real database.

## Decision

`runAdminCommand(args, io, db)` receives an `io` object (`stdin`, `stdout`, `stderr`, `isInteractive`, `readHiddenLine`) and the database. `src/cli/admin-main.ts` gives it the `process` streams, the raw-mode `readHiddenLine` from `src/cli/terminal.ts` and the database singleton. Commands report expected failures with a `CommandFailure` error that becomes exit code 1.

## Consequences

- Unit tests cover all commands with a fake `io` and an in-memory database.
- `readHiddenLine` (raw mode) has no automated test. It was checked by hand in a pseudo-terminal.
