-- Add position_played column to matches table
ALTER TABLE public.matches
ADD COLUMN position_played TEXT;
