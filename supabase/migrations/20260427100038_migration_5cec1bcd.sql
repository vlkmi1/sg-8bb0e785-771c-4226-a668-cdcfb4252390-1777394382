-- Opravit credit_transactions table policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);