-- 0028_auto_create_user_profiles.sql
-- Every auth user must have a user_profiles row. Until now profiles were created
-- ONLY client-side on profile setup, so accounts that signed up but never visited
-- profile setup had NO row — making them invisible to the admin user list, the
-- feed, the rating engine, and anything that joins on user_profiles.
--
-- Two parts:
--   1. Backfill a row for every existing auth user that lacks one.
--   2. A trigger that creates the row automatically on every future sign-up.
--
-- All other user_profiles columns are nullable or have defaults (subscription_tier
-- → 'free', is_admin → false, early_access → false, …), so inserting just user_id
-- is safe.

-- 1. Backfill existing accounts ----------------------------------------------
INSERT INTO public.user_profiles (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 2. Auto-create on sign-up --------------------------------------------------
-- SECURITY DEFINER so it runs as the function owner and bypasses RLS (the new
-- user has no session at insert time). ON CONFLICT keeps it idempotent.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
