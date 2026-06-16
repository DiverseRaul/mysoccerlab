-- 0019_subscription_tier.sql
--
-- "Lab Pro" premium tier. Adds a subscription tier + a custom accent colour to
-- user_profiles. Billing is mock for now (the client flips the tier directly);
-- the own-user UPDATE policy from profiles_table.sql already allows that.
-- A future Stripe webhook would set subscription_tier server-side instead.
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS accent_color TEXT;
