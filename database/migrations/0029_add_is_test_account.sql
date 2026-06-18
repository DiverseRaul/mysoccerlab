-- 0029_add_is_test_account.sql
-- Dedicated "test account" flag so we can hide seed/QA accounts (e.g. "Admin 1")
-- from the public feed, player search, and the global admin browse lists WITHOUT
-- hiding real admins. Previously we keyed off is_admin, which also hid the real
-- admin's own data — wrong, because an admin is still a real player.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT false;

-- Mark the known seed/test account. Safe to re-run (idempotent).
UPDATE user_profiles
  SET is_test_account = true
  WHERE player_name = 'Admin 1';

-- Helpful for the "exclude test accounts" filters that scan for flagged rows.
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_test_account
  ON user_profiles (is_test_account)
  WHERE is_test_account = true;
