# ADR 0006: Local-first development with Docker

- Status: Accepted
- Date: 2026-09-30

## Context
Contributors need PostgreSQL, Redis, API, workers, and files running identically on every machine without cloud accounts.

## Decision
Run Postgres 16 and Redis 7 via `docker-compose.yml`. Application code runs on Node.js locally.

## Consequences
Reproducible environments; developers need Docker Desktop with WSL 2 on Windows.
