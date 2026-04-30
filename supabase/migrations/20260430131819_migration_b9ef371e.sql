-- Nové RLS politiky pro subscription_plans - veřejné čtení aktivních + admin vidí vše
CREATE POLICY "public_read_active_plans" 
ON subscription_plans FOR SELECT 
USING (is_active = true);

CREATE POLICY "admin_read_all_plans" 
ON subscription_plans FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);