# 0002. Manage many admins with a CLI only

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

Many people can manage jokes. All have the same permissions. The panel needs a way to create, list and delete admins and change passwords.

## Decision

Store admins in an `admins` table. Identify each admin by email (trimmed, lowercase, unique). Manage admins only with CLI commands: `admin:create`, `admin:list`, `admin:delete`, `admin:password`. The panel does not manage admins.

## Consequences

- Less attack surface and fewer screens.
- A developer with shell access must add each admin.
- An admin UI can come later on top of the same table.
