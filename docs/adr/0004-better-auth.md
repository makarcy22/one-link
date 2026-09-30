# ADR 0004: Better Auth for authentication

- Status: Accepted
- Date: 2026-09-30

## Context
One Link needs email/password, social login, sessions, verification, and reset now, plus organizations/teams later — inside a TypeScript + Fastify stack with data in our own database.

## Decision
Use Better Auth (self-hosted TypeScript auth library) with its Fastify integration and PostgreSQL adapter. Redis backs short-lived auth data via secondary storage.

## Consequences
Full control and no per-user vendor lock-in; we own secrets handling, email delivery, rate limiting, upgrades, and security review. Social-platform publishing OAuth stays separate with encrypted token storage.
