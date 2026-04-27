-- Opravit generated_videos table policies
DROP POLICY IF EXISTS "Users can delete own videos" ON public.generated_videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.generated_videos;
DROP POLICY IF EXISTS "Users can view own videos" ON public.generated_videos;

CREATE POLICY "Users can delete own videos"
ON public.generated_videos FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own videos"
ON public.generated_videos FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own videos"
ON public.generated_videos FOR SELECT
USING ((SELECT auth.uid()) = user_id);