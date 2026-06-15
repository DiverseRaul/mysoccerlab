-- 0015_penalties_conceded.sql
--
-- When a foul is logged inside the player's own penalty box, the map logger
-- reclassifies it as a penalty given away. Tracked per match and penalised in
-- the rating engine (see src/lib/rating.js).
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS penalties_conceded INTEGER DEFAULT 0;

ALTER TABLE public.matches
  ALTER COLUMN penalties_conceded SET DEFAULT 0;
