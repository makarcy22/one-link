# ADR 0007: BullMQ on Redis for background jobs

- Status: Accepted
- Date: 2026-09-30

## Context
Media processing, publishing with retries, analytics ingestion, trend collection, AI generation, and notifications need durable, retryable job execution.

## Decision
Use BullMQ backed by the existing Redis service, with workers in `apps/worker`.

## Consequences
Idempotent job handlers required (safe publishing retries); delayed/repeatable jobs cover scheduling; no extra queue infrastructure to operate.
