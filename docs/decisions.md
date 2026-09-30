# Steering decisions

## 2026-09-27 — Use Design Concept V2

### Context
Needed a locked visual direction for implementation.

### Decision
Use `design/One-Link-Design-Concept-V2.html`.

### Reason
Split announcement hero, clear publishing-engine message, analytics cards, and animated one-to-many trailer.

### Consequences
Future screens must follow V2 spacing, typography, color, and publishing-status patterns.

## 2026-09-27 — Database, auth, and storage

### Context
Needed locked MVP technical decisions before implementation.

### Decision
- Database: PostgreSQL.
- Authentication: Better Auth.
- Storage: local disk for development, Cloudflare R2 for production.

### Reason
PostgreSQL fits relational publishing, billing, and analytics data. Better Auth fits the TypeScript + Fastify stack and keeps user data in our own database. Local disk enables fast local development; R2 provides production object storage behind an S3-compatible interface.

### Consequences
Application code must use a storage abstraction so the same code path works locally and against R2 later.
