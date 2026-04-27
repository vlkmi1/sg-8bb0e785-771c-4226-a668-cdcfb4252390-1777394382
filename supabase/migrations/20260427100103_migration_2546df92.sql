-- Opravit ai_influencers table policies
DROP POLICY IF EXISTS "Users can delete own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can insert own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can update own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can view own influencers" ON public.ai_influencers;

CREATE POLICY "Users can delete own influencers"
ON public.ai_influencers FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own influencers"
ON public.ai_influencers FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own influencers"
ON public.ai_influencers FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own influencers"
ON public.ai_influencers FOR SELECT
USING ((SELECT auth.uid()) = user_id);