-- generated_videos - smazat duplicitní policies
DROP POLICY IF EXISTS "Users can delete own videos" ON public.generated_videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.generated_videos;
DROP POLICY IF EXISTS "Users can view own videos" ON public.generated_videos;
DROP POLICY IF EXISTS "delete_own_videos" ON public.generated_videos;
DROP POLICY IF EXISTS "insert_own_videos" ON public.generated_videos;
DROP POLICY IF EXISTS "select_own_videos" ON public.generated_videos;

CREATE POLICY "videos_select" ON public.generated_videos FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "videos_insert" ON public.generated_videos FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "videos_delete" ON public.generated_videos FOR DELETE USING ((SELECT auth.uid()) = user_id);