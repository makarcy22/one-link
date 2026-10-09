-- Verification only: makes no changes.
SELECT column_name AS user_two_factor_column
FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'twoFactorEnabled';

SELECT COUNT(*) AS twofactor_rows FROM "twoFactor";
