-- payments - kompletní fix
DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
DROP POLICY IF EXISTS "users_insert_payments" ON public.payments;
DROP POLICY IF EXISTS "users_own_payments" ON public.payments;

CREATE POLICY "payments_select" ON public.payments FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);