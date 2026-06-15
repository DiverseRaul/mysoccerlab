-- 0016_pass_direction.sql
--
-- Passes logged on the map can now record a direction: the start is the tapped
-- origin (x_pct/y_pct) and the end is an optional second tap (x2_pct/y2_pct),
-- so pass arrows and progressive passes can be drawn. Both nullable — events
-- without a destination (or non-pass events) just leave them empty.
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

ALTER TABLE public.match_heatmap_points
  ADD COLUMN IF NOT EXISTS x2_pct NUMERIC(5,2);

ALTER TABLE public.match_heatmap_points
  ADD COLUMN IF NOT EXISTS y2_pct NUMERIC(5,2);
