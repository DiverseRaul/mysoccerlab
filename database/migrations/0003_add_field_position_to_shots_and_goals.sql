-- Migration: Add field_position column to shots and goals tables
-- This allows tracking where on the field shots and goals were taken from

-- Add field_position to shots table (stores x,y coordinates as text)
ALTER TABLE public.shots
ADD COLUMN field_position TEXT;

-- Add field_position to goals table (stores x,y coordinates as text)
ALTER TABLE public.goals
ADD COLUMN field_position TEXT;

-- Add comment explaining the field_position values
COMMENT ON COLUMN public.shots.field_position IS 'Field coordinates where shot was taken from (stored as "x,y" percentage string, e.g., "45.50,67.25")';
COMMENT ON COLUMN public.goals.field_position IS 'Field coordinates where goal was scored from (stored as "x,y" percentage string, e.g., "45.50,67.25")';
