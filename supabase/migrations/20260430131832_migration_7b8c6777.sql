-- Nové RLS politiky pro credit_packages - veřejné čtení aktivních + admin vidí vše
CREATE POLICY "public_read_active_packages" 
ON credit_packages FOR SELECT 
USING (is_active = true);

CREATE POLICY "admin_read_all_packages" 
ON credit_packages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);