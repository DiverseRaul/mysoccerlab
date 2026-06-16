-- 0018_ai_message_feedback.sql
--
-- Persist per-message thumbs feedback on AI Coach replies (1 = up, -1 = down,
-- 0 = none) and allow owners to update their own messages.
--
-- Apply manually in the Supabase SQL editor (no migration runner in this repo).

ALTER TABLE public.ai_chat_messages
  ADD COLUMN IF NOT EXISTS feedback SMALLINT DEFAULT 0;

DROP POLICY IF EXISTS "own messages update" ON public.ai_chat_messages;
CREATE POLICY "own messages update" ON public.ai_chat_messages
  FOR UPDATE USING (auth.uid() = user_id);
