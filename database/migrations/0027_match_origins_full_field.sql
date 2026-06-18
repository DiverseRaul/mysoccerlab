-- Marks whether a match's shot/goal ORIGINS were logged over the full pitch
-- (new x,y logging) vs the old attacking-half-only field. Existing matches stay
-- NULL and are treated as half-field on read (origins compressed to the top
-- half so they don't bunch near the halfway line). New matches set this true.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS origins_full_field BOOLEAN;
