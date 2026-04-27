-- 1. referrals - opravit referrers_select_own_referrals policy
DROP POLICY IF EXISTS "referrers_select_own_referrals" ON public.referrals;
CREATE POLICY "referrals_select_own" 
ON public.referrals 
FOR SELECT 
USING ((SELECT auth.uid()) = referrer_id OR (SELECT auth.uid()) = referred_user_id);