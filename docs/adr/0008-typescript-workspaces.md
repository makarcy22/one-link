# ADR 0008: npm workspaces with TypeScript everywhere

- Status: Accepted
- Date: 2026-09-30

## Context
A solo/small team needs one language, shared types, and minimal tooling friction across web, API, and workers.

## Decision
TypeScript across `apps/*` and `packages/*`, managed as npm workspaces with a shared `tsconfig.base.json`.

## Consequences
Shared domain types and validation; frontend/backend stay in sync. Revisit only if a workload (e.g. heavy ML, native mobile) demands another language.
