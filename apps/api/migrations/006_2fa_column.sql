-- 2FA columns/tables that the full-schema dump could not add because the
-- core tables already existed. Safe to re-run (IF NOT EXISTS guards).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean;

CREATE TABLE IF NOT EXISTS "twoFactor" (
  "id" text not null primary key,
  "secret" text not null,
  "backupCodes" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "verified" boolean,
  "failedVerificationCount" integer,
  "lockedUntil" timestamptz
);

CREATE INDEX IF NOT EXISTS "twoFactor_secret_idx" on "twoFactor" ("secret");
CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" on "twoFactor" ("userId");
