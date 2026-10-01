# 0004. Keep sessions in SQLite

- Status: Accepted
- Date: 2026-09-30
- Classification: Irreversible

## Context

After login, the server must know who the admin is. Options: server-side sessions in SQLite, or a stateless encrypted cookie.

## Decision

Store sessions in a `sessions` table (`id`, `admin_id`, `csrf_token`, `created_at`, `expires_at`). The cookie `sid` holds only a random 32-byte id. The `id` column holds the SHA-256 hash (hex) of that value, not the value. Sessions expire 24 hours after login, with no extension on activity.

## Consequences

- Logout, `admin:delete` and `admin:password` end sessions at once.
- One database read for each admin request.
- A copy of the database file (for example, a backup) does not contain usable session cookies.
- When this hash was added, all sessions that existed before it became invalid. Admins had to log in again one time.
- The project has no migration system. The table gets its final shape in the first step. A later schema change needs a manual migration. Thus we classify it as irreversible.
