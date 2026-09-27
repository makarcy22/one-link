# ONE LINK

## Implementation Plan

**Product:** One Link
**Positioning:** Create once. Optimize once. Publish everywhere.
**Primary users:** Content creators and businesses
**Product type:** All-in-one social media creation, publishing, trend discovery, and analytics platform

This document converts the One Link PRD into a phased engineering and implementation plan.

## Locked MVP Technical Decisions

- **Database:** PostgreSQL.
- **Authentication:** Better Auth.
- **File and media storage:** Cloudflare R2 for production, with local-disk storage for local development.
- **Local-first development:** PostgreSQL, Redis, API, workers, and files run locally; no cloud dependency is required for MVP development.
- **Architecture:** Modular monolith first.
- **Design concept:** `design.html`, including its animated one-to-many publishing trailer.

what I have asked the ai “i want you to use the information to edit the implementation plan, i want you to use postgrlsql for database, better auth for authotication what do you reccommendation and why do you reccommand it and storage i will use cloudflare r2 at the moment every thing will run on my local disk”? this was the deicision I made 


then I asked the ai to change the systems 

 
---

# Current Repository State

The repository currently contains planning, pricing, stack, MVP, design, and branding documents. There is still no application code, frontend, backend, database schema, infrastructure configuration, test suite, or package setup.

Important files include:

- `One link.md`
- `One Link Implementation Plan.md`
- `One Link MVP.md`
- `One Link Monetization and Pricing Plan.md`
- `One Link Pricing Model.csv`
- `One Link Recommended Stack.md`
- Design previews and logo concepts

`One link.md` is the authoritative PRD. The implementation follows this product loop:

> **CREATE → OPTIMIZE → DISCOVER → PUBLISH → MONITOR → IMPROVE**

---

# Phase 0: Product and Technical Assumptions

## Recommended initial scope

Build a **responsive web application first**, with mobile-optimized creation and publishing workflows.

Recommended approach:

- Web MVP first.
- Design mobile-first responsive layouts.
- Add native mobile apps later if creator demand requires camera-first workflows.
- Defer team collaboration, agency workflows, marketplace features, AI video/image/voice generation, competitor monitoring, and advanced social listening to post-MVP.

## Major constraint

Not every platform supports identical publishing through public APIs. The architecture must distinguish between:

1. Direct API publishing.
2. Scheduled API publishing.
3. Draft, export, or manual publishing.
4. Unsupported or restricted destinations.

This is especially important for WhatsApp and platform-specific video/publishing permissions. The MVP should show users exactly what will happen on each destination.

---

# Phase 1: UX Foundation and Design System

## 1.1 Information architecture

Translate the PRD navigation into the application structure:

- Home/command center
- Create
- Trends
- Inspire
- Planner
- Analytics
- Assistant
- Profile/settings

Define global states for:

- No connected accounts
- No created content
- No scheduled posts
- Insufficient analytics data
- Failed publishing
- Restricted platform capability

## 1.2 Design tokens

Create platform-agnostic design tokens for:

- Color
- Typography
- Spacing
- Radius
- Elevation
- Iconography
- Motion
- Light and dark themes
- Breakpoints
- Content density

The product must remain usable in bright outdoor environments and low-bandwidth contexts.

## 1.3 Core component library

Build reusable components for:

- Navigation
- Cards and dashboards
- Media uploaders
- Video/audio players
- Rich text and caption editors
- Hashtag inputs and saved groups
- Scheduling controls
- Calendar views
- Analytics charts
- Trend lists and filters
- Publishing checklists
- Platform capability indicators
- Notifications
- Empty, loading, error, and offline states

## 1.4 Creation-studio UX patterns

Standardize workflows for:

- Video creation and editing
- Graphic creation
- Written content
- Audio recording and voice-over
- Uploading existing media
- AI-assisted generation
- Reviewing platform-specific variants
- Publishing or scheduling

A critical UX rule: users must be able to preview and edit each platform variant before choosing **Post Everywhere**.

## 1.5 Accessibility and usability standards

Require:

- Keyboard navigation
- Visible focus states
- Sufficient color contrast
- Text alternatives for media controls
- Accessible chart summaries
- Reduced-motion support
- Minimum touch-target sizes
- Clear error recovery paths

## Phase 1 exit criteria

- Approved navigation and information architecture.
- Complete design-token system.
- Core UI component library.
- High-fidelity MVP screens for Home, Create, Trends, Planner, Analytics, Assistant, and Profile.
- Locked visual direction: `design.html`.
- Accessibility checklist incorporated into definition of done.

---

# Phase 2: Architectural Decisions

## 2.1 Recommended architecture

Start with a **modular monolith**, not microservices.

Suggested structure:

```text
apps/
  web/
  api/
  worker/

packages/
  ui/
  design-tokens/
  domain/
  platform-connectors/
  ai/
  analytics/
  shared/
```

This allows clear boundaries while avoiding premature distributed-system complexity.

## 2.2 Technology recommendations

### Frontend

Recommended:

- TypeScript
- React
- Vite or Next.js
- Component library built on the One Link design system
- Charting library for analytics
- PWA support for mobile-friendly installation and offline drafts

Choose Next.js if SEO and marketing/content pages are important. Choose a Vite SPA if the MVP is primarily an authenticated application.

### Backend

Confirmed for MVP:

- TypeScript API
- Fastify modular monolith
- PostgreSQL for relational data
- Local PostgreSQL for development
- Managed PostgreSQL for staging and production
- Redis for queues, caching, rate limiting, and scheduled jobs
- Local Redis for development
- Background workers for:
  - Media processing
  - Publishing
  - Analytics ingestion
  - Trend collection
  - AI generation
  - Notifications

### Authentication

Confirmed for MVP: **Better Auth**.

Use Better Auth because:

- It is TypeScript-first and fits the React + Fastify stack.
- It has a documented Fastify integration.
- It supports email/password login, social login, sessions, email verification, and password reset.
- It stores users and sessions in One Link’s own PostgreSQL database.
- It avoids early dependence on a paid managed-authentication vendor.
- It has an organization and plugin model that can support future team, agency, and MFA requirements.
- Social-platform publishing authorization remains separate: TikTok, Instagram, Facebook, LinkedIn, and other connectors still need their own OAuth flows and encrypted token storage.

MVP authentication must include:

- Email/password signup and login.
- Google social login.
- Email verification.
- Password reset.
- Secure sessions.
- Login rate limiting.
- Audit logs for sensitive account actions.

### Storage

Confirmed approach:

- **Local development:** local-disk file storage.
- **Production:** Cloudflare R2.
- **Delivery:** CDN for playback and downloads in staging/production.
- **Abstraction:** all application code uses an S3-compatible storage interface, not R2-specific calls.

Required storage layout, using separate buckets or prefixes for:

- Original uploads
- Processed media
- Thumbnails
- Exports
- Temporary processing files

Local-first rules:

- PostgreSQL stores metadata and file pointers, not media bytes.
- Local uploads live under a versioned local storage directory.
- The same code path must work against local disk now and R2 later by changing endpoint, bucket, credentials, and region settings.
- Local disk is acceptable for development only; it is not production backup, high-availability, or multi-server storage.

### Media processing

Required:

- FFmpeg-based pipeline
- Multiple resolutions and aspect ratios
- Platform-specific derivatives
- Thumbnails and preview images
- Audio normalization
- Duration, format, and size validation

## 2.3 Architecture Decision Records

Create ADRs for at least:

1. Web-first versus native-first.
2. Modular monolith versus microservices.
3. SQL versus NoSQL for core domain data — **decided: PostgreSQL**.
4. Queue and worker technology.
5. Object-storage provider — **decided: Cloudflare R2 for production, local disk for development**.
6. Authentication and workspace model — **decided: Better Auth**.
7. AI-provider abstraction.
8. Trend-source strategy.
9. Analytics architecture.
10. Multi-region or single-region deployment.
11. Monorepo tooling.
12. API versioning strategy.

## Phase 2 exit criteria

- Approved stack.
- Repository structure created.
- Local development environment working.
- Local PostgreSQL, Redis, API, workers, and local file storage all run successfully.
- Better Auth login, verification, and password-reset flows work locally.
- Local storage driver passes the same upload, download, delete, and metadata tests as the future R2 driver.
- ADR documents stored in the repository.
- Environments defined for development, staging, and production.

---

# Phase 3: Identity, Workspaces, Brands, and Social Accounts

## 3.1 Accounts and roles

MVP roles:

- Individual creator
- Business owner

Future roles:

- Team member
- Client
- Agency administrator
- Approver or viewer

Design the data model so workspaces and teams can be added without rewriting ownership logic.

## 3.2 Brand profiles

Implement PRD brand-profile fields:

- Brand name
- Logo/profile image
- Description
- Colors
- Voice and tone
- Website
- Connected accounts
- Preferred hashtags
- Saved captions
- Content categories

The AI system should consume this profile as structured context, not free text alone.

## 3.3 Social-account connections

Implement:

- OAuth connection flows
- Token storage and refresh
- Token expiry handling
- Reconnection prompts
- Account disconnection
- Per-account publishing permissions
- Audit logs for account changes

OAuth secrets and refresh tokens must be encrypted using a key-management service.

## Phase 3 exit criteria

- Secure signup/login through Better Auth.
- Email/password and Google login working.
- Email verification and password reset working.
- Creator and business profiles.
- Brand profile CRUD.
- Social-platform OAuth remains separate from One Link login.
- At least one social account can connect, refresh, disconnect, and reconnect safely.

---

# Phase 4: Content and Creation-Studio Foundation

## 4.1 Core domain model

Initial entities should include:

- Users
- Workspaces and brands
- Social accounts
- Media assets
- Content projects
- Captions
- Hashtag groups
- Platform variants
- Schedules
- Publishing jobs
- Analytics snapshots
- Notifications
- AI generations
- Templates

## 4.2 Media library

Implement:

- Video uploads
- Image uploads
- Audio uploads
- Graphics and documents
- Metadata extraction
- Search and filtering
- Drafts
- Published-content references
- Storage quotas
- Safe deletion and retention rules

## 4.3 Creation modules

Build in this order:

1. Written-content studio.
2. Graphic creation from templates.  
3. Audio upload, recording, and voice-over. COMING SOON
4. Video upload, trimming, combining, captions, and resizing.
5. AI-assisted creation layered across all studios.

Written content is fastest to validate. Video is the most technically demanding and should receive the largest engineering allocation.

## 4.4 Upload-and-repurpose workflow

Implement the PRD’s major differentiator:

1. Upload one source asset.
2. Analyze content and metadata.
3. Generate platform-specific derivatives.
4. Generate captions, hashtags, and calls to action.
5. Let the user review each platform variant.
6. Publish, schedule, or export.

## Phase 4 exit criteria

- Users can create, upload, edit, save, duplicate, and organize content.
- One upload can produce multiple reviewed platform variants.
- Large media uploads are reliable and resumable where practical.

---

# Phase 5: Trends, Inspiration, Captions, and AI Consultant

## 5.1 Trend architecture

Use a pluggable provider model:

```text
Trend source → normalization → categorization → scoring → personalization → UI
```

Support filtering by:

- Location: global, country, region
- Platform
- Category
- User niche
- Time window
- Rising versus established trends

Do not hardcode the product to a single trend-data vendor.

## 5.2 Hashtag system

Implement:

- Trending hashtags
- Rising hashtags
- Niche hashtags
- Related hashtags
- User-created hashtags
- Saved hashtag groups
- Relevance scoring
- Overuse or mismatch warnings

The system should explain why a hashtag is suggested, not merely show that it is popular.

## 5.3 Caption, hook, keyword, and mention tools

Implement:

- Tone selection
- Platform-aware captions
- Hook generator by hook type
- Keyword extraction
- Mention suggestions
- Brand-voice adaptation
- Editable AI output
- Regeneration and version history

Users must retain final editorial control.

## 5.4 AI social assistant

The assistant should support PRD questions such as:

- What should I post today?
- What is trending in my niche?
- Give me TikTok ideas.
- Which hashtags fit this video?
- Rewrite this caption.
- Why did my last post perform poorly?
- What should I create next?
- When should I post?

Required AI infrastructure:

- Provider abstraction
- Prompt versioning
- Brand-context injection
- Content-context injection
- Performance-context injection
- Output moderation
- Token and cost tracking
- Caching for repeated requests
- User feedback signals

## Phase 5 exit criteria

- Trends can be filtered and converted into content ideas.
- “Create This” moves directly from inspiration into creation.
- Captions, hashtags, hooks, and recommendations are editable and brand-aware.
- AI usage and costs are observable.

---

# Phase 6: Publishing, Scheduling, and Platform Adaptation

## 6.1 Platform-connector abstraction

Create a common interface for every destination:

```text
authenticate
refresh credentials
validate media
create draft
publish now
schedule
check status
retrieve performance data
handle errors
```

Each connector implements only the capabilities supported by that platform.

## 6.2 Publishing workflow

Required behavior:

1. User selects one or more platforms.
2. One Link validates formats, durations, captions, and permissions.
3. Platform variants are generated.
4. User reviews and edits variants.
5. User chooses publish now or schedule.
6. Jobs enter a durable outbox or queue.
7. Workers execute publishing with retries.
8. Status is shown per platform.
9. Failures provide actionable recovery steps.

Publishing must be idempotent so retries do not create duplicate posts where the platform API permits safe retry semantics.

## 6.3 Content calendar and scheduling

Implement:

- Scheduled posts
- Published posts
- Drafts
- Campaigns
- Drag-and-drop rescheduling
- Time-zone-aware scheduling
- Best-time recommendations
- Conflict and failure indicators

## 6.4 Best-time recommendations

Use:

- Audience activity
- Platform
- Content type
- Historical performance
- Region
- Previous engagement

The MVP should explain recommendations in plain language and allow users to override them.

## Phase 6 exit criteria

- Multi-destination publishing works where APIs allow it.
- Unsupported actions fall back to clear draft, export, or manual workflows.
- Every post has per-platform status and retry history.
- Scheduling is reliable across time zones.

---

# Phase 7: Analytics and Performance Intelligence

## 7.1 Metrics architecture

Separate:

- Raw platform metrics
- Normalized internal metrics
- Aggregated snapshots
- Derived engagement scores
- Historical comparisons

This prevents vendor-specific metric changes from breaking the entire dashboard.

## 7.2 MVP analytics

Implement:

- Views
- Reach
- Likes and reactions
- Comments
- Shares
- Saves
- Followers and growth
- Engagement
- Watch performance
- Profile visits
- Cross-platform comparisons

## 7.3 Performance coach

After publication, generate explanations such as:

- Above- or below-average performance.
- Strong opening or completion behavior.
- High sharing or saving behavior.
- Caption or topic resonance.
- Posting-time correlation.
- Recommended next experiment.

Avoid deterministic causal claims where data is insufficient. Use language such as “correlated with,” “suggests,” or “worth testing.”

## 7.4 “What should I create next?”

Use:

- Content history
- Category performance
- Engagement patterns
- Trend relevance
- Brand goals
- Previously successful formats

Each recommendation should link directly to creation, templates, or relevant trends.

## Phase 7 exit criteria

- Unified cross-platform dashboard.
- Per-post performance detail.
- Understandable performance explanations.
- Actionable next-content recommendations.

---

# Phase 8: Quality, Security, Performance, and DevOps

## 8.1 Testing strategy

Required:

- Unit tests for domain logic.
- Integration tests for APIs, queues, storage, and connectors.
- Contract tests for platform adapters.
- End-to-end tests for:
  - Signup and account connection
  - Creation and upload
  - AI optimization
  - Publishing
  - Scheduling
  - Analytics
- Media-pipeline tests across formats and sizes.
- Load tests for uploads, workers, publishing queues, and analytics ingestion.
- Failure tests for expired tokens, API outages, and partial publishing failures.

## 8.2 Security requirements

Implement:

- Encrypted secrets and OAuth tokens
- Least-privilege service credentials
- Secure upload validation
- Malware and file-type controls
- Rate limiting
- Audit logging
- Session and token lifecycle management
- PII minimization
- Data export and deletion workflows

## 8.3 Performance budgets

Set measurable targets for:

- Page load and interaction time
- Upload reliability
- Media-processing latency
- Publishing-job latency
- Analytics refresh latency
- AI response time
- Mobile performance on mid-range devices

## 8.4 CI/CD and environments

Required:

- Pull-request checks
- Linting and type checking
- Automated tests
- Database migrations
- Preview environments
- Staging parity with production
- Controlled production releases
- Feature flags
- Database backups and restore tests
- Monitoring, logging, tracing, and alerting

## Phase 8 exit criteria

- Security review completed.
- Backup and restore tested.
- CI blocks defective releases.
- Production observability is operational.

---

# Phase 9: MVP Launch Readiness

## MVP checklist mapped to the PRD

### Creation

- Video creation and editing
- Graphic creation
- Written content
- Audio
- AI assistance
- Device uploads

### Discovery

- Trending topics and hashtags
- Content inspiration
- Platform trends
- Basic trend filtering

### Optimization

- Captions
- Hashtags
- Keywords
- Hooks
- Mentions
- Platform-specific suggestions

### Publishing

- Connected accounts
- Multi-platform publishing where supported
- Scheduling
- Drafts

### Analytics

- Views, reach, engagement, followers, shares, comments
- Cross-platform overview

### AI

- Content ideas
- Trend consultation
- Caption generation
- Hashtag generation
- Posting-time recommendations
- Performance explanations

## Launch requirements

- Onboarding for creators and businesses.
- Account-connection guidance.
- Publishing-capability explanations.
- Help documentation.
- Feedback collection.
- Usage analytics.
- Support process.
- Privacy policy and terms.
- Incident-response plan.

---

# Phase 10: Post-MVP Roadmap

After MVP validation, prioritize:

1. Team collaboration and approvals.
2. Agency and client workspaces.
3. Campaign management.
4. Advanced brand kits.
5. Content recycling automation.
6. Influencer collaboration.
7. AI image, video, and voice generation.
8. Audience segmentation.
9. Competitor monitoring.
10. Social listening.
11. Automated content calendars.
12. Creator marketplace.

Each expansion should be gated by measurable MVP retention, publishing success rate, AI usefulness, and support burden.

---

# Suggested Build Sequence

1. Design system and UX foundation.
2. Architecture and repository setup.
3. Auth, brands, and social accounts.
4. Media library and written/graphic creation.
5. Video and audio creation.
6. Trends and inspiration.
7. AI captions, hashtags, hooks, and assistant.
8. Platform adaptation and publishing.
9. Planner and scheduling intelligence.
10. Analytics and performance coaching.
11. Hardening, launch, and measurement.
12. Post-MVP expansion.

# Immediate Next Decisions Needed

Before implementation starts, confirm:

1. Web-first MVP versus mobile-app MVP.
2. Preferred frontend approach.
3. Preferred backend language and ecosystem.
4. Private MVP versus public creator beta.
5. Initial target platforms for publishing connectors.

