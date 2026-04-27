-- credit_transactions - ponechat pouze 2 policies
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "view_transactions" ON public.credit_transactions;

CREATE POLICY "credit_select" ON public.credit_transactions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "credit_insert" ON public.credit_transactions FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);