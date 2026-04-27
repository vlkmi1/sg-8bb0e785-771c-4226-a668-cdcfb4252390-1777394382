-- social_accounts - kompletní fix
DROP POLICY IF EXISTS "delete_own_accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "insert_own_accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "select_own_accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "update_own_accounts" ON public.social_accounts;

CREATE POLICY "social_accounts_select" ON public.social_accounts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_insert" ON public.social_accounts FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_update" ON public.social_accounts FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_delete" ON public.social_accounts FOR DELETE USING ((SELECT auth.uid()) = user_id);