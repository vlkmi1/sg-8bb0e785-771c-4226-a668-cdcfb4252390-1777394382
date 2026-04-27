-- user_subscriptions - kompletní fix
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_insert_subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_own_subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_update_subscriptions" ON public.user_subscriptions;

CREATE POLICY "subscriptions_select" ON public.user_subscriptions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_insert" ON public.user_subscriptions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_update" ON public.user_subscriptions FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_delete" ON public.user_subscriptions FOR DELETE USING ((SELECT auth.uid()) = user_id);