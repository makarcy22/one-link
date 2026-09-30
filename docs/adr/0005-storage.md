# ADR 0005: Cloudflare R2 with local-disk development

- Status: Accepted
- Date: 2026-09-30

## Context
Media originals, derivatives, thumbnails, and exports need durable storage and cheap delivery, while local development must work with zero cloud dependency.

## Decision
Production uses Cloudflare R2 behind a CDN; development uses local-disk storage. All code talks to an S3-compatible storage interface, never to R2-specific calls.

## Consequences
Same code path runs locally and in production via configuration; local disk is dev-only (no backup/HA guarantees).
