-- Onboarding "What brings you here?" choice. Drives the default Dashboard mode
-- (Matches vs Training) and lets a Training-only user live in the app without
-- ever logging a match. Nullable: existing users have no choice recorded yet.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS primary_focus TEXT
  CHECK (primary_focus IS NULL OR primary_focus IN ('matches', 'training', 'both'));
