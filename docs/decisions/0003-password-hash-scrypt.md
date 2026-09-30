# 0003. Hash passwords with scrypt from node:crypto

- Status: Accepted
- Date: 2026-09-30
- Classification: Irreversible

## Context

Admin passwords must be stored as hashes. Options: scrypt (built into Node), argon2 or bcrypt (native npm packages).

## Decision

Use the asynchronous `scrypt` from `node:crypto` with a random 16-byte salt. Use the OWASP parameters `N=2^14`, `r=8`, `p=5` (16 MiB of memory for each hash) and a 64-byte key. Store the parameters in the hash string (`scrypt$N$r$p$salt$hash`, salt and key in base64). Compare with `timingSafeEqual`. Passwords have 12 to 128 characters and no composition rules (NIST 800-63B).

## Consequences

- No new native dependency.
- The stored hashes use this format. A change of algorithm needs a migration on the next login of each admin, or a password reset for all admins. Thus we classify it as irreversible.
- The parameters are in the string, so we can make them stronger later without a break.
