# One Link

**Create once. Reach everywhere.**

One Link is an all-in-one social-media workspace for creators and businesses: create, optimize, discover, publish, monitor, and improve content from one place.

## Repository map

- `One link.md` — Product Requirements Document.
- `One Link Implementation Plan.md` — phased engineering plan and locked technical decisions.
- `One Link MVP.md` — MVP scope, milestones, and acceptance criteria.
- `docs/decisions.md` — steering decisions.
- `docs/design-refinement-notes.md` — design changes and reasons.
- `design/One-Link-Design-Concept-V2.html` — locked visual design concept.
- `design/One-Link-Design-Concept-V2-Mobile.html` — phone view of the locked concept.
- `prototype/index.html` — local single-page prototype.

## Locked MVP decisions

- Database: PostgreSQL.
- Authentication: Better Auth.
- Storage: local disk for development, Cloudflare R2 for production.
- Design: Design Concept V2.

## Local development

See `docs/local-development.md`. Quick start:

```powershell
Copy-Item .env.example .env
npm run setup
npm run infra:up
npm run infra:ps
```
