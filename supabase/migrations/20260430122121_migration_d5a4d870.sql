-- Vytvoření RLS politiky pro čtení credit_packages (veřejné čtení)
DROP POLICY IF EXISTS "public_read_credit_packages" ON credit_packages;
CREATE POLICY "public_read_credit_packages" 
ON credit_packages FOR SELECT 
USING (is_active = true);