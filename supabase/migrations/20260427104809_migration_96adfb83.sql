-- voice_conversations - kompletní fix
DROP POLICY IF EXISTS "delete_own_voice" ON public.voice_conversations;
DROP POLICY IF EXISTS "insert_own_voice" ON public.voice_conversations;
DROP POLICY IF EXISTS "select_own_voice" ON public.voice_conversations;
DROP POLICY IF EXISTS "update_own_voice" ON public.voice_conversations;

CREATE POLICY "voice_conversations_select" ON public.voice_conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_insert" ON public.voice_conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_update" ON public.voice_conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_delete" ON public.voice_conversations FOR DELETE USING ((SELECT auth.uid()) = user_id);