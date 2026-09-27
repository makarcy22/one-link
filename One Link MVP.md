# ONE LINK

## MVP Scope and Build Plan

**Product:** One Link
**MVP goal:** Let a creator or business go from “I don’t know what to post” to “I created it, optimized it, published it, and understand how it performed.”
**Primary loop:** Create → Optimize → Discover → Publish → Monitor → Improve

---

## 1. MVP Objective

The MVP must prove that One Link can serve as a central social-media workspace, not merely another scheduler.

A successful MVP user can:

1. Create or upload content.
2. Improve it with AI.
3. Discover relevant trends and hashtags.
4. Adapt it for selected platforms.
5. Publish now or schedule it.
6. Monitor performance from one dashboard.
7. Receive a recommendation for what to create next.

---

## 2. MVP Users

### Content creators

- TikTok creators
- Instagram creators
- Facebook creators
- YouTubers
- Influencers and personal brands
- Musicians, comedians, photographers, writers, and podcasters

### Businesses

- Small businesses
- Restaurants and shops
- Fashion brands
- Service businesses
- Startups and organizations

---

## 3. MVP Success Criteria

The MVP is successful when users can complete the full loop without switching between multiple applications for routine work.

Measure:

- Account-connection success rate.
- Content-creation completion rate.
- Upload-to-published conversion rate.
- Publishing success rate per platform.
- Scheduling reliability.
- AI suggestion acceptance or edit rate.
- Seven-day and thirty-day creator retention.
- Support tickets per active user.

---

## 4. MVP Scope

### 4.1 Included

#### Onboarding, identity, and brand

- Creator or business signup and login.
- Brand profile:
  - Brand name
  - Logo or profile image
  - Description
  - Brand colors
  - Brand voice
  - Website
  - Social accounts
  - Preferred hashtags
  - Saved captions
  - Content categories
- Secure social-account connection.
- Token refresh and reconnection handling.

#### Creation studio

- Written-content creation.
- Graphic creation from templates.
- Audio upload and voice recording.
- Voice-over and background-music support.
- Video upload and basic editing:
  - Trimming
  - Clip combination
  - Text overlays
  - Captions and subtitles
  - Transitions and effects
  - Resizing for supported platforms
- Device uploads for:
  - Video
  - Photos
  - Audio
  - Graphics
  - Documents
- Draft saving and duplication.

#### Media and content library

- Personal videos, images, audio, graphics, captions, hashtags, templates, drafts, and published content.
- Search and filtering.
- Metadata extraction.
- Storage quotas.
- Safe deletion and retention rules.

#### Upload and repurpose

- Upload one source asset.
- Generate platform-specific versions.
- Generate captions, hashtags, calls to action, and posting recommendations.
- Require user review before publishing.

#### Trends and inspiration

- Trending topics, hashtags, sounds, formats, and keywords.
- Filters for:
  - Global, country, and region
  - Platform
  - Category
  - User niche
- Content ideas and prompts.
- Hook ideas and video concepts.
- “Create This” workflow from inspiration to creation.

#### Optimization and AI assistance

- Caption generation by platform, audience, brand, and tone.
- Hashtag generation and saved hashtag groups.
- Keyword and mention suggestions.
- Hook generator.
- Platform-specific wording.
- Editable AI output.
- Posting-time recommendations.
- Performance explanations.
- “What should I create next?” recommendations.

#### Publishing and planner

- Connected social accounts.
- Platform-specific validation.
- Platform-specific previews.
- Multi-platform publishing where supported.
- Publish now.
- Scheduling.
- Drafts.
- Visual content calendar.
- Time-zone-aware scheduling.
- Per-platform publishing status and retries.

#### Analytics

- Views.
- Reach.
- Likes and reactions.
- Comments.
- Shares.
- Saves.
- Followers and follower growth.
- Engagement.
- Watch performance.
- Profile visits.
- Cross-platform overview.
- Plain-language performance explanations.

#### Notifications and settings

- Scheduled-post reminders.
- Trend alerts.
- Performance alerts.
- Posting-time suggestions.
- Notification preferences.
- Account and privacy settings.

---

## 5. Explicit Non-Goals for the MVP

The MVP should not include:

- Team collaboration.
- Agency or client workspaces.
- Approval workflows.
- Creator marketplace.
- Influencer collaboration.
- Competitor monitoring.
- Advanced social listening.
- AI video generation.
- AI image generation.
- AI voice generation.
- Audience segmentation.
- Automated full-month content calendars.
- Advanced experiments or multivariate testing.

These belong in the post-MVP roadmap.

---

## 6. Platform Connector Expectations

The MVP must not pretend all platforms support identical publishing.

For each destination, define one of the following:

- Direct publishing.
- Scheduled publishing.
- Draft creation followed by manual completion.
- Export for manual posting.
- Unsupported action with a clear explanation.

Required connector behavior:

- Validate media before submission.
- Validate captions, durations, formats, and permissions.
- Show per-platform status.
- Retry safely without unintended duplicates where APIs permit it.
- Preserve a complete publishing-attempt history.

---

## 7. MVP Data Requirements

The MVP needs persistent models for:

- Users.
- Brand profiles.
- Connected social accounts.
- Media assets.
- Content projects.
- Captions.
- Hashtag groups.
- Platform variants.
- Publishing schedules.
- Publishing jobs and attempts.
- Trend records.
- AI generations.
- Analytics snapshots.
- Notifications.
- Audit events.

Analytics must normalize platform-specific metrics so dashboard changes by one provider do not break cross-platform reporting.

---

## 8. MVP Milestones

### Milestone 1: Foundation

- Repository and environments.
- Authentication.
- Brand profiles.
- Media library.
- File uploads.
- Design-system implementation.

### Milestone 2: Creation

- Written studio.
- Graphic templates.
- Audio recording and voice-over.
- Video upload and basic editing.
- Drafts and duplication.

### Milestone 3: Discovery and AI

- Trend browsing and filtering.
- Inspiration library.
- Captions, hashtags, hooks, keywords, and mentions.
- AI assistant.
- “Create This” workflow.

### Milestone 4: Publishing

- Social-account connections.
- Platform adapters.
- Platform-specific validation and previews.
- Publish now.
- Scheduling and calendar.
- Publishing status and retries.

### Milestone 5: Analytics and Intelligence

- Cross-platform dashboard.
- Post-level analytics.
- Performance explanations.
- Next-content recommendations.

### Milestone 6: Launch Readiness

- Security review.
- Performance testing.
- Backup and restore testing.
- Help documentation.
- Support process.
- Privacy and terms coverage.
- Production monitoring.

---

## 9. MVP Acceptance Criteria

The MVP cannot launch unless:

- A new user can connect at least one social account.
- A user can upload existing content without recreating it.
- A user can create written, graphic, audio, and basic video content.
- AI-generated captions and hashtags can be edited before publishing.
- Platform variants can be previewed separately.
- Publishing failures identify the affected platform and next action.
- Scheduled posts respect the user’s time zone.
- Analytics are available in one dashboard.
- Users receive at least one useful next-content recommendation.
- No MVP workflow silently assumes unsupported platform behavior.

---

## 10. Definition of Done

Every MVP feature must have:

- Implemented UI and API behavior.
- Validation and error handling.
- Accessibility review.
- Unit or integration coverage for important logic.
- End-to-end coverage for critical user journeys.
- Updated documentation where applicable.
- Observable logs and metrics for background work.
- Successful staging verification before production release.

---

## 11. Risks and Assumptions

### Platform APIs

Social-platform permissions, review processes, rate limits, and publishing capabilities may change. The connector abstraction and capability matrix must isolate these changes. It important 


### AI quality

AI suggestions must remain editable and brand-aware. Poor suggestions should be treated as a product defect, not merely a model limitation.

### Media complexity

Video transcoding, large uploads, mobile networks, and format restrictions are major technical risks. The media pipeline needs early performance testing.

### Copyright and audio

The MVP must avoid encouraging unauthorized use of copyrighted music or media. Prefer user-owned, licensed, or platform-permitted audio.

### Regional trends

Global, national, and regional trend coverage depends on available data sources. The MVP should clearly indicate data coverage and limitations.

