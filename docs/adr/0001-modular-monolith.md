# ADR 0001: Modular monolith first

- Status: Accepted
- Date: 2026-09-30

## Context
One Link needs clear boundaries (web, API, workers, connectors, AI, analytics) without distributed-system overhead before product-market fit.

## Decision
Build a modular monolith: `apps/web`, `apps/api`, `apps/worker`, plus `packages/*` for shared boundaries.

## Consequences
Faster iteration and simpler deploys now; media processing, publishing, analytics, or AI can split into services later behind stable interfaces.
