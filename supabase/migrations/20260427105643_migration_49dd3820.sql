-- admin_commission_settings - opravit admins_manage_settings policy
DROP POLICY IF EXISTS "admins_manage_settings" ON public.admin_commission_settings;

CREATE POLICY "admins_manage_settings" 
ON public.admin_commission_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);