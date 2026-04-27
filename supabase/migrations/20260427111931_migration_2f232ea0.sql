-- referral_payouts - opravit zbývající 2 policies
DROP POLICY IF EXISTS "users_insert_own_payouts" ON public.referral_payouts;
DROP POLICY IF EXISTS "view_payouts" ON public.referral_payouts;

-- Optimalizované verze
CREATE POLICY "users_insert_own_payouts" 
ON public.referral_payouts 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "view_payouts" 
ON public.referral_payouts 
FOR SELECT 
USING (
  (SELECT auth.uid()) = user_id 
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);