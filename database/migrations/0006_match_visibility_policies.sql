-- Enable RLS on matches (idempotent if already enabled)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Ensure users can view their own matches
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view matches of public profiles
DROP POLICY IF EXISTS "Users can view matches of public profiles" ON public.matches;
CREATE POLICY "Users can view matches of public profiles" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = matches.user_id
      AND user_profiles.is_public = true
    )
  );

-- Policy: Users can view matches of people they follow
DROP POLICY IF EXISTS "Users can view matches of followed users" ON public.matches;
CREATE POLICY "Users can view matches of followed users" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = matches.user_id
    )
  );
