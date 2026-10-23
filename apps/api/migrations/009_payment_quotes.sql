-- The exact amount shown to a person when they start a payment, so a rate change in between never changes it.
-- Safe to run more than once.
CREATE TABLE IF NOT EXISTS payment_quotes (
  ref        TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  plan       TEXT NOT NULL,
  currency   TEXT NOT NULL,
  amount     NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
