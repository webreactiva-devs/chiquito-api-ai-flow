# 0008. No login rate limit, but a login concurrency limit

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The panel will be public. The product owner decided not to add a login rate limit. But each login runs scrypt, which uses a lot of CPU and memory. The panel and the public API run in the same process. Many login requests could stop the public API.

## Decision

No rate limit and no account lockout. Allow at most 4 password verifications at the same time. More login requests get `503` at once, with no queue. When the email does not exist, verify against a dummy hash, so the response time does not show which emails exist.

## Consequences

- The public API stays available during a login flood.
- An attacker can still try many passwords, one batch at a time. The 12-character minimum reduces this risk.
- During an attack, real admins can get `503`.
- A rate limit can be added later with `@fastify/rate-limit`.
