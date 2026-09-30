# ONE LINK

## Recommended Technology Stack

**Goal:** Build a responsive web MVP first, with mobile-optimized creation and publishing workflows.
**Architecture:** Modular monolith first; move to distributed services only when scale requires it.
**Preferred language strategy:** TypeScript across frontend and backend where practical.

---

## Overall recommended MVP stack

| Layer | Recommended choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite PWA | Fast development, one web codebase, mobile-friendly installation, instant updates without app stores |
| Backend API | TypeScript + Fastify, modular monolith | High performance, low overhead, same language as frontend, easier MVP iteration |
| Background workers | Same backend codebase + Redis queue | Reliable media processing, publishing retries, analytics ingestion, AI jobs, scheduling |
| Database | Managed PostgreSQL | Strong relational model for users, brands, content, schedules, publishing jobs, and analytics |
| Cache and queue | Redis | Caching, rate limiting, job queues, scheduled publishing, trend processing |
| File and media storage | S3-compatible object storage + CDN | Durable uploads, processed derivatives, thumbnails, fast playback and downloads |
| Media processing | FFmpeg-based worker pipeline | Full control over formats, resolutions, thumbnails, platform-specific derivatives, and costs |
| AI | Provider-agnostic AI orchestration layer | Avoid lock-in, support multiple models, version prompts, control quality and spending |
| Authentication | Email/social login with secure sessions | Simple onboarding for creators and businesses |
| Payments | Subscription billing provider with webhooks | Recurring Creator and Business plans plus usage-based add-ons |
| Notifications | Email + push + in-app notifications | Reminders, trend alerts, publishing updates, performance alerts |
| Analytics product | Internal normalized metrics + charts | Cross-platform dashboard without depending on one provider’s metric definitions |
| Observability | Logging, metrics, tracing, error tracking, alerts | Production visibility for publishing failures, worker delays, AI errors, and cost spikes |
| Deployment | Containers + CI/CD + staging and production | Repeatable releases, preview environments, safe database migrations |

---

## Frontend comparison

| Option | Strengths | Risks or trade-offs | Verdict |
|---|---|---|---|
| React + TypeScript + Vite PWA | Fast MVP, responsive design, installable web app, large ecosystem | Less native device access than iOS/Android apps | **Best for One Link MVP** |
| Next.js + React + TypeScript | Strong SEO, marketing pages, full-stack flexibility | More complexity if the MVP is mainly an authenticated dashboard | Best if public SEO and marketing content are priorities |
| Vue + TypeScript | Approachable, productive, good ecosystem | Smaller hiring pool than React for this type of product | Viable alternative |
| Flutter web | Shared code with future mobile apps | Web maturity and complex editor UX can be harder | Not recommended for MVP |
| Native iOS + Android first | Best camera, editing, background-upload, and notification experience | Two codebases, slower MVP, store review overhead, higher cost | Recommended later only if proven necessary |

### Why React + Vite PWA is better for the MVP

- One responsive codebase serves phone, tablet, and desktop.
- Beta users can start from a link.
- Releases do not wait for app-store approval.
- Creation, trends, planner, analytics, and assistant screens can share components.
- A PWA can later be complemented by native apps for camera-first or offline-heavy workflows.

---

## Backend comparison

| Option | Strengths | Risks or trade-offs | Verdict |
|---|---|---|---|
| TypeScript + Fastify modular monolith | Same language as frontend, fast, low overhead, good for APIs and workers | Requires discipline to preserve module boundaries | **Best for One Link MVP** |
| TypeScript + NestJS | Structured, enterprise-friendly, good for larger teams | More boilerplate and slower early iteration for a solo/small team | Best if a larger backend team is expected soon |
| Python + FastAPI | Excellent AI/data ecosystem, productive API development | Second language if frontend is TypeScript; async/worker architecture needs care | Best if AI, analytics, or data science becomes dominant |
| Firebase/Supabase-first backend | Very fast auth, database, and storage setup | Less control for complex publishing queues, media pipelines, and multi-platform integrations | Useful for prototype, less ideal for full publishing engine |
| Microservices first | Independent scaling and deployments | Major operational overhead before product-market fit | Not recommended for MVP |

### Why TypeScript + Fastify is better for the MVP

- Frontend and backend developers can share types and validation logic.
- Publishing jobs, retries, scheduling, and webhooks are easier to reason about in one deployable system.
- The modular-monolith structure can later split media processing, publishing, analytics, or AI into separate services.

---

## Data, queue, and storage comparison

| Need | Recommended | Alternatives | Why recommended |
|---|---|---|---|
| Core relational data | Managed PostgreSQL | MySQL, SQLite for local-only dev | Best fit for accounts, brands, content, schedules, publishing attempts, analytics history |
| Cache | Redis | In-memory cache, CDN cache only | Needed for performance, rate limits, queues, and repeated AI/trend requests |
| Job queue | Redis-backed queue | Database polling, cloud-only queues | Durable retries for publishing, transcoding, analytics, notifications |
| File storage | S3-compatible object storage | Local disk, VPS storage | Scales safely for video, audio, images, exports, and derivatives |
| Delivery | CDN | Direct object-storage URLs | Faster playback and downloads, lower origin load |
| Search | PostgreSQL full-text search first | Dedicated search engine later | Sufficient for MVP media, captions, hashtags, templates, and trends |

---

## Media-processing comparison

| Option | Strengths | Risks or trade-offs | Verdict |
|---|---|---|---|
| FFmpeg worker pipeline | Maximum control, predictable long-term cost, customizable platform derivatives | More engineering work upfront | **Best for One Link MVP engine** |
| Managed transcoding service | Faster setup, less DevOps | Higher variable cost, less control, potential lock-in | Useful fallback or later premium option |
| Browser-only processing | No server cost, immediate previews | Limited reliability for large videos and background work | Useful for previews, not primary publishing pipeline |

### Why FFmpeg workers are better

One Link’s value depends on reliable platform-specific video versions. A worker pipeline can:

- Validate formats before publishing.
- Generate vertical, square, and landscape derivatives.
- Create thumbnails and previews.
- Normalize audio.
- Retry failed jobs.
- Track processing costs and failures.

---

## AI architecture comparison

| Option | Strengths | Risks or trade-offs | Verdict |
|---|---|---|---|
| Provider-agnostic AI layer | Model flexibility, cost control, prompt versioning, safer switching | Requires an abstraction layer | **Best for One Link** |
| Single AI provider hardcoded | Fastest initial integration | Pricing, quality, availability, and policy changes can break the product | Not recommended as long-term architecture |
| Local-only models | Privacy and potential cost benefits | Quality, hardware, scaling, and maintenance challenges | Possible later for selected tasks |

The AI layer must include:

- Brand-profile context.
- Content context.
- Performance context.
- Prompt versions.
- Output moderation.
- Caching.
- Cost tracking.
- User feedback.
- Editable results.

---

## Deployment and operations comparison

| Option | Strengths | Risks or trade-offs | Verdict |
|---|---|---|---|
| Containerized modular monolith + managed database/storage | Portable, repeatable, scalable enough for 100–1,000 users | Requires basic DevOps setup | **Best for MVP through early scale** |
| All-in-one PaaS | Very fast deployment | Can become expensive or constraining for workers, media, and queues | Good for prototype or very early beta |
| Full cloud microservices/Kubernetes first | Maximum scalability and control | Excessive complexity before revenue and retention | Not recommended yet |

Required environments:

- Development.
- Staging.
- Production.
- Pull-request preview environments where practical.

---

## Final recommendation

For the One Link MVP, the better stack is:

> **React + TypeScript + Vite PWA, TypeScript + Fastify modular API, PostgreSQL, Redis, S3-compatible storage plus CDN, FFmpeg workers, and a provider-agnostic AI layer.**

This is better because it gives One Link:

- One language across the main application.
- One responsive product for mobile and desktop.
- Reliable publishing and media workflows.
- Controlled AI costs.
- A database model that supports creators, businesses, content, schedules, publishing history, and analytics.
- A clear upgrade path to native apps, microservices, managed transcoding, and advanced AI features after product-market fit.
