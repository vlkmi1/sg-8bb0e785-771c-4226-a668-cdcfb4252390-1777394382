-- referral_codes - kompletní fix
DROP POLICY IF EXISTS "users_insert_own_code" ON public.referral_codes;
DROP POLICY IF EXISTS "users_select_own_code" ON public.referral_codes;
DROP POLICY IF EXISTS "users_update_own_code" ON public.referral_codes;

CREATE POLICY "referral_codes_select" ON public.referral_codes FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "referral_codes_insert" ON public.referral_codes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "referral_codes_update" ON public.referral_codes FOR UPDATE USING ((SELECT auth.uid()) = user_id);