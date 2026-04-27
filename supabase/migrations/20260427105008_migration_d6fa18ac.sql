-- admin_settings - opravit s EXISTS subquery místo neexistující funkce
DROP POLICY IF EXISTS "Allow public read access to admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_delete_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_insert_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_read_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_update_settings" ON public.admin_settings;

CREATE POLICY "admin_settings_select" ON public.admin_settings FOR SELECT USING (true);

CREATE POLICY "admin_settings_insert" ON public.admin_settings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "admin_settings_update" ON public.admin_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "admin_settings_delete" ON public.admin_settings FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);