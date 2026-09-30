# Architecture decision records

Each file records one decision: its context, the decision and its consequences.

Classification:

- **Reversible**: we can change the decision later at a low cost. No data or external contract depends on it.
- **Irreversible**: a change later needs a data migration, causes data loss, or breaks stored data. Think twice before you change it.

| ADR | Decision | Classification |
| --- | --- | --- |
| [0001](0001-server-rendered-admin-panel.md) | Serve the admin panel as server-rendered HTML | Reversible |
| [0002](0002-multiple-admins-managed-by-cli.md) | Manage many admins with a CLI only | Reversible |
| [0003](0003-password-hash-scrypt.md) | Hash passwords with scrypt from node:crypto | Irreversible |
| [0004](0004-sessions-in-sqlite.md) | Keep sessions in SQLite | Irreversible |
| [0005](0005-csrf-token-in-session.md) | Protect forms with a CSRF token stored in the session | Reversible |
| [0006](0006-hard-delete-with-cascade.md) | Delete jokes with their votes and stats | Irreversible |
| [0007](0007-database-is-source-of-truth.md) | Make SQLite the source of truth and protect db:init | Reversible |
| [0008](0008-no-login-rate-limit.md) | No login rate limit, but a login concurrency limit | Reversible |
| [0009](0009-secure-cookie-by-default.md) | Set the Secure cookie attribute by default | Reversible |
| [0010](0010-unicode-case-insensitive-search.md) | Search joke content with Unicode lowercase | Reversible |
| [0011](0011-tailwind-cli-local-assets.md) | Build Tailwind CSS with the CLI and serve it locally | Reversible |
| [0012](0012-admin-panel-conventions.md) | English UI and no OpenAPI entries for the admin panel | Reversible |
