# ADR 0003: PostgreSQL for core data

- Status: Accepted
- Date: 2026-09-30

## Context
One Link data is relational (user → brand → content → variant → schedule → attempt → analytics) with transactions, billing, permissions, and reporting.

## Decision
Use PostgreSQL: local instance for development, managed PostgreSQL for staging/production. Store media bytes in object storage, never in the database.

## Consequences
Strong consistency and reporting; requires connection pooling, indexes, migrations, backups, and an analytics retention policy at scale.
