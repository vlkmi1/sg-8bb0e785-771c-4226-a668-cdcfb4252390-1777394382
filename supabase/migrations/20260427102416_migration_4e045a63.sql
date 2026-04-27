-- referral_earnings - smazat duplicitní
DROP POLICY IF EXISTS "Users can view own earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "referrers_select_own_earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "system_insert_earnings" ON public.referral_earnings;

CREATE POLICY "earnings_select" ON public.referral_earnings FOR SELECT USING ((SELECT auth.uid()) = referrer_id);
CREATE POLICY "earnings_insert" ON public.referral_earnings FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);