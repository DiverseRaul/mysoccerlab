-- 0013_feed_event_visibility_policies.sql
--
-- The Pitch feed renders a per-match mini shot map (and tactical heatmap) built
-- from `goals`, `shots`, and `match_heatmap_points` rows of OTHER players'
-- matches. Mirror the match visibility rules from 0006_match_visibility_policies.sql
-- onto these event tables so cross-user reads are allowed; without these, RLS
-- silently returns empty arrays and the shot maps render blank for everyone but
-- the owner.
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

-- ─── goals ──────────────────────────────────────────────────────────────────
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view goals of public profiles" ON public.goals;
CREATE POLICY "Users can view goals of public profiles" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = goals.user_id
      AND user_profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view goals of followed users" ON public.goals;
CREATE POLICY "Users can view goals of followed users" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = goals.user_id
    )
  );

-- ─── shots ──────────────────────────────────────────────────────────────────
ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shots" ON public.shots;
CREATE POLICY "Users can view own shots" ON public.shots
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shots of public profiles" ON public.shots;
CREATE POLICY "Users can view shots of public profiles" ON public.shots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = shots.user_id
      AND user_profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view shots of followed users" ON public.shots;
CREATE POLICY "Users can view shots of followed users" ON public.shots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = shots.user_id
    )
  );

-- ─── match_heatmap_points (tactical heatmap shown in the feed shot map) ──────
ALTER TABLE public.match_heatmap_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view heatmap of public profiles" ON public.match_heatmap_points;
CREATE POLICY "Users can view heatmap of public profiles" ON public.match_heatmap_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = match_heatmap_points.user_id
      AND user_profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view heatmap of followed users" ON public.match_heatmap_points;
CREATE POLICY "Users can view heatmap of followed users" ON public.match_heatmap_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = match_heatmap_points.user_id
    )
  );
