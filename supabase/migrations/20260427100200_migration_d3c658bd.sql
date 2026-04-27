-- Opravit referral_earnings table policies
DROP POLICY IF EXISTS "Users can view own earnings" ON public.referral_earnings;

CREATE POLICY "Users can view own earnings"
ON public.referral_earnings FOR SELECT
USING ((SELECT auth.uid()) = referrer_id);