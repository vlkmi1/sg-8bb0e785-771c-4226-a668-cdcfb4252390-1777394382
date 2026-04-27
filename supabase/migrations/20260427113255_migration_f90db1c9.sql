-- admin_commission_settings - smazat duplicitní SELECT policies a vytvořit jednu
DROP POLICY IF EXISTS "admins_manage_settings" ON public.admin_commission_settings;
DROP POLICY IF EXISTS "public_read_settings" ON public.admin_commission_settings;

-- Vytvořit jednu policy pro SELECT (veřejné čtení)
CREATE POLICY "commission_settings_select" 
ON public.admin_commission_settings 
FOR SELECT 
USING (true);