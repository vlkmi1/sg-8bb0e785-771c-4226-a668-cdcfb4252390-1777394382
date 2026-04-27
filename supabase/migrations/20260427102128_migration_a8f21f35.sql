-- api_keys - smazat všechny staré policies a vytvořit jen 4 optimalizované
DROP POLICY IF EXISTS "Users can delete own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own keys" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_own" ON public.api_keys;

-- Vytvořit jen 4 optimalizované policies
CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_insert" ON public.api_keys FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_update" ON public.api_keys FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_delete" ON public.api_keys FOR DELETE USING ((SELECT auth.uid()) = user_id);