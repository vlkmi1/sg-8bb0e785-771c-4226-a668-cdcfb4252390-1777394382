-- ai_influencers - smazat staré a vytvořit optimalizované
DROP POLICY IF EXISTS "Users can create own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can delete own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can insert own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can update own influencers" ON public.ai_influencers;
DROP POLICY IF EXISTS "Users can view own influencers" ON public.ai_influencers;

CREATE POLICY "influencers_select" ON public.ai_influencers FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_insert" ON public.ai_influencers FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_update" ON public.ai_influencers FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_delete" ON public.ai_influencers FOR DELETE USING ((SELECT auth.uid()) = user_id);