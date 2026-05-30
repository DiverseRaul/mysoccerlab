-- Add 'post' as a valid outcome on shot placements.
-- A shot that hits the post is not a goal, and the new wider canvas in the
-- UI lets users place markers on the frame itself.

ALTER TABLE public.practice_shot_placements
  DROP CONSTRAINT IF EXISTS practice_shot_placements_outcome_check;

ALTER TABLE public.practice_shot_placements
  ADD CONSTRAINT practice_shot_placements_outcome_check
  CHECK (outcome IN ('goal','save','miss','post'));
