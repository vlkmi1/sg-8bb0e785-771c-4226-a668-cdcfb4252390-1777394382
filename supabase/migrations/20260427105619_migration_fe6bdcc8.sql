-- referral_payouts - opravit admins_update_payouts policy
DROP POLICY IF EXISTS "admins_update_payouts" ON public.referral_payouts;

CREATE POLICY "admins_update_payouts" 
ON public.referral_payouts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);