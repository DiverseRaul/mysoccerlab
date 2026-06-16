-- AI-generated weekly training plans (Training → Weekly Plan tab). One current
-- plan per user — generate/regenerate upserts the single row keyed by user_id.
CREATE TABLE IF NOT EXISTS public.training_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  focus TEXT,
  plan JSONB NOT NULL,          -- parseCalendar() output: [{ DayTitle, FocusTheme, Drills[] }]
  week_start DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own training plans" ON public.training_plans;
CREATE POLICY "Users manage own training plans" ON public.training_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
