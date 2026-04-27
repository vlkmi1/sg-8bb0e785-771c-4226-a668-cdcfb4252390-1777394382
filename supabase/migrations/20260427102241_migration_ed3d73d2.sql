-- music_generations - smazat duplicitní a vytvořit jen 4
DROP POLICY IF EXISTS "Users can create own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can delete own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can insert own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can update own music" ON public.music_generations;
DROP POLICY IF EXISTS "Users can view own music" ON public.music_generations;

CREATE POLICY "music_select" ON public.music_generations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_insert" ON public.music_generations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_update" ON public.music_generations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_delete" ON public.music_generations FOR DELETE USING ((SELECT auth.uid()) = user_id);