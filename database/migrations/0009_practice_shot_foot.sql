-- Per-shot foot tracking on practice_shot_placements.
-- Nullable: NULL means "either / didn't track" so existing rows stay valid.

ALTER TABLE public.practice_shot_placements
  ADD COLUMN IF NOT EXISTS foot TEXT NULL;

ALTER TABLE public.practice_shot_placements
  DROP CONSTRAINT IF EXISTS practice_shot_placements_foot_check;

ALTER TABLE public.practice_shot_placements
  ADD CONSTRAINT practice_shot_placements_foot_check
  CHECK (foot IS NULL OR foot IN ('left','right'));
