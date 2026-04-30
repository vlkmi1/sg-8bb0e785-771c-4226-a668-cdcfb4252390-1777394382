-- Jednoduché RLS pro payment_settings - čtení pro přihlášené
CREATE POLICY "authenticated_read_payment_settings" 
ON payment_settings FOR SELECT 
TO authenticated
USING (true);

-- Update pro přihlášené
CREATE POLICY "authenticated_update_payment_settings" 
ON payment_settings FOR UPDATE 
TO authenticated
USING (true);