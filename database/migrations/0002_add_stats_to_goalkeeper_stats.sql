-- Add additional stats columns to goalkeeper_match_stats table
ALTER TABLE public.goalkeeper_match_stats
ADD COLUMN successful_passes INTEGER DEFAULT 0,
ADD COLUMN unsuccessful_passes INTEGER DEFAULT 0,
ADD COLUMN goals INTEGER DEFAULT 0,
ADD COLUMN assists INTEGER DEFAULT 0;
