-- Let practice drills + sessions surface in The Pitch feed, mirroring the match
-- visibility policies in 0006. Without these extra SELECT policies, RLS silently
-- returns empty arrays for other users' practice data.
-- (The own-user policies from 0007 stay; these are additive.)

-- ── practice_drills ─────────────────────────────────────────────────────────
ALTER TABLE public.practice_drills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View drills of public profiles" ON public.practice_drills;
CREATE POLICY "View drills of public profiles" ON public.practice_drills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = practice_drills.user_id
      AND user_profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "View drills of followed users" ON public.practice_drills;
CREATE POLICY "View drills of followed users" ON public.practice_drills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = practice_drills.user_id
    )
  );

-- ── practice_sessions ───────────────────────────────────────────────────────
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View sessions of public profiles" ON public.practice_sessions;
CREATE POLICY "View sessions of public profiles" ON public.practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = practice_sessions.user_id
      AND user_profiles.is_public = true
    )
  );

DROP POLICY IF EXISTS "View sessions of followed users" ON public.practice_sessions;
CREATE POLICY "View sessions of followed users" ON public.practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE user_relationships.follower_id = auth.uid()
      AND user_relationships.following_id = practice_sessions.user_id
    )
  );
