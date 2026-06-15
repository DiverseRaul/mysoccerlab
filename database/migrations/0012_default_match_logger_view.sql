-- Per-user default for the live match logging UI: 'map' (tap-the-pitch logger) or
-- 'counters' (classic +/- counter cards). Defaults to 'map' per the map-first redesign.
-- The Counters/Map toggle in the live match view lets users switch per session.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS default_match_logger_view TEXT DEFAULT 'map';

ALTER TABLE public.user_profiles
  ALTER COLUMN default_match_logger_view SET DEFAULT 'map';
