CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  scopes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_user ON social_connections(user_id);
