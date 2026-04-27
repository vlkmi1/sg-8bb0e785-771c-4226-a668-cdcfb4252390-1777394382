-- Opravit music_generations table policies
DROP POLICY IF EXISTS "Users can delete own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can insert own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can view own music" ON public.music_generations;

CREATE POLICY "Users can delete own music"
ON public.music_generations FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own music"
ON public.music_generations FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own music"
ON public.music_generations FOR SELECT
USING ((SELECT auth.uid()) = user_id);