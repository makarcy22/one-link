-- Dollars or local money for manual payments. Safe to run more than once.
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS currency TEXT    NOT NULL DEFAULT 'USD';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS amount   NUMERIC NOT NULL DEFAULT 0;
