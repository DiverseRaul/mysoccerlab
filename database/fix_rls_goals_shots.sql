-- ============================================================
-- Fix: Enable RLS on goals and shots tables
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── GOALS TABLE ─────────────────────────────────────────────

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users can only read their own goals
CREATE POLICY "Users can read own goals"
  ON public.goals FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only insert goals for their own matches
CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only update goals for their own matches
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only delete goals for their own matches
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );


-- ── SHOTS TABLE ─────────────────────────────────────────────

ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

-- Users can only read their own shots
CREATE POLICY "Users can read own shots"
  ON public.shots FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only insert shots for their own matches
CREATE POLICY "Users can insert own shots"
  ON public.shots FOR INSERT
  WITH CHECK (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only update shots for their own matches
CREATE POLICY "Users can update own shots"
  ON public.shots FOR UPDATE
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );

-- Users can only delete shots for their own matches
CREATE POLICY "Users can delete own shots"
  ON public.shots FOR DELETE
  USING (
    match_id IN (
      SELECT id FROM public.matches WHERE user_id = auth.uid()
    )
  );
