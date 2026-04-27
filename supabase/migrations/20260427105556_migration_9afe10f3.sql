-- referrals - opravit policy system_insert_referrals
DROP POLICY IF EXISTS "system_insert_referrals" ON public.referrals;

CREATE POLICY "system_insert_referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);