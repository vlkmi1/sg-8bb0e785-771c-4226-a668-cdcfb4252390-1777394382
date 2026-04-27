-- conversations - smazat všechny staré policies a vytvořit jen 4 optimalizované
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;

-- Vytvořit jen 4 optimalizované policies
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_delete" ON public.conversations FOR DELETE USING ((SELECT auth.uid()) = user_id);