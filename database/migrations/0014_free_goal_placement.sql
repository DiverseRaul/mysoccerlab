-- 0014_free_goal_placement.sql
--
-- Goal/shot placement used to be one of 9 fixed quadrants. We now capture the
-- exact spot the ball crossed the goal line as a free "x,y" percentage string
-- (same format as field_position), so the goal view can show precisely where it
-- went. `quadrant` is still written (derived from the tap) so existing
-- quadrant-based views keep working.
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS placement TEXT;

ALTER TABLE public.shots
  ADD COLUMN IF NOT EXISTS placement TEXT;
