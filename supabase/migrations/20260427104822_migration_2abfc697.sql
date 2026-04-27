-- viral_videos - kompletní fix
DROP POLICY IF EXISTS "Users can create viral videos" ON public.viral_videos;
DROP POLICY IF EXISTS "Users can delete own viral videos" ON public.viral_videos;
DROP POLICY IF EXISTS "Users can view own viral videos" ON public.viral_videos;

CREATE POLICY "viral_videos_select" ON public.viral_videos FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "viral_videos_insert" ON public.viral_videos FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "viral_videos_delete" ON public.viral_videos FOR DELETE USING ((SELECT auth.uid()) = user_id);