-- 0030_waitlist_own_select.sql
-- The premium "Notify me" flow now checks whether you're already on the waitlist
-- before inserting (so repeat clicks don't stack duplicate rows). That read needs
-- a SELECT policy — migration 0020 only granted INSERT. Without this, the dedup
-- check always sees zero rows and keeps inserting duplicates.

DROP POLICY IF EXISTS "waitlist own select" ON public.waitlist;
CREATE POLICY "waitlist own select" ON public.waitlist
  FOR SELECT USING (auth.uid() = user_id);
