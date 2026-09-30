# ADR 0002: Responsive web MVP first

- Status: Accepted
- Date: 2026-09-30

## Context
Creators work from phones, but separate iOS/Android apps would triple MVP cost and slow validation.

## Decision
Build one responsive web app first (React + TypeScript + Vite, PWA support), designed mobile-first.

## Consequences
One codebase and instant updates; native apps only if camera-first, offline, or background-upload needs are proven.
