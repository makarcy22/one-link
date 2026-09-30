# ADR 0006: Local-first development with Docker

- Status: Accepted
- Date: 2026-09-30

## Context
Contributors need PostgreSQL, Redis, API, workers, and files running identically on every machine without cloud accounts.

## Decision
Run Postgres 16 and Redis 7 via `docker-compose.yml`. Application code runs on Node.js locally.

## Consequences
Reproducible environments; developers need Docker Desktop with WSL 2 on Windows.

## Amendment (2026-09-30)
On machines without BIOS virtualization, Plan B applies: PostgreSQL 16 and Memurai Developer (Redis-compatible) installed natively on Windows. Connection strings stay identical (`localhost:5432`, `localhost:6379`), so application code is unaffected.
