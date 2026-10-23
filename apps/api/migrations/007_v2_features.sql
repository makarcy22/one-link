-- One Link v2: platform variants, library, preferences, notifications, Facebook pages, payments.
-- Safe to run more than once: every statement uses IF NOT EXISTS.
-- Ids that point at older tables are stored as TEXT without foreign keys, so this file works
-- whatever id type your existing tables use. Rows are cleaned up by the API.

CREATE TABLE IF NOT EXISTS post_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  platform    TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '',
  hashtags    TEXT NOT NULL DEFAULT '[]',
  link        TEXT NOT NULL DEFAULT '',
  media_id    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_id, platform)
);
CREATE INDEX IF NOT EXISTS post_variants_user_idx ON post_variants (user_id);

CREATE TABLE IF NOT EXISTS user_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'graphic',
  data       TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_templates_user_idx ON user_templates (user_id);

CREATE TABLE IF NOT EXISTS saved_captions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  hashtags   TEXT NOT NULL DEFAULT '[]',
  platform   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS saved_captions_user_idx ON saved_captions (user_id);

CREATE TABLE IF NOT EXISTS user_prefs (
  user_id      TEXT PRIMARY KEY,
  role         TEXT NOT NULL DEFAULT '',
  niche        TEXT NOT NULL DEFAULT '',
  region       TEXT NOT NULL DEFAULT 'global',
  goals        TEXT NOT NULL DEFAULT '[]',
  platforms    TEXT NOT NULL DEFAULT '[]',
  onboarded_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  link       TEXT NOT NULL DEFAULT '',
  dedupe_key TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);

-- Pages a person manages on Facebook. The page token is stored encrypted (AES-256-GCM).
CREATE TABLE IF NOT EXISTS social_pages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  platform       TEXT NOT NULL,
  page_id        TEXT NOT NULL,
  page_name      TEXT NOT NULL DEFAULT '',
  page_token_enc TEXT NOT NULL DEFAULT '',
  can_post       BOOLEAN NOT NULL DEFAULT TRUE,
  selected       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, page_id)
);

-- Webhook events already handled, so a retried event is never applied twice.
CREATE TABLE IF NOT EXISTS payment_events (
  id          TEXT PRIMARY KEY,
  provider    TEXT NOT NULL,
  event_type  TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Manual payments (mobile money or bank transfer) that the owner confirms by hand.
CREATE TABLE IF NOT EXISTS payment_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  email       TEXT NOT NULL DEFAULT '',
  plan        TEXT NOT NULL,
  method      TEXT NOT NULL DEFAULT '',
  reference   TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON payment_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_requests_user_idx ON payment_requests (user_id);

-- Existing tables: add only what v2 needs.
ALTER TABLE subscriptions   ADD COLUMN IF NOT EXISTS provider     TEXT NOT NULL DEFAULT 'paystack';
ALTER TABLE subscriptions   ADD COLUMN IF NOT EXISTS provider_ref TEXT NOT NULL DEFAULT '';
ALTER TABLE publishing_jobs ADD COLUMN IF NOT EXISTS external_url TEXT NOT NULL DEFAULT '';
ALTER TABLE publishing_jobs ADD COLUMN IF NOT EXISTS dry_run      BOOLEAN NOT NULL DEFAULT FALSE;
