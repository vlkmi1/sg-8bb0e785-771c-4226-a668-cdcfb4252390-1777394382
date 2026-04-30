-- RLS politiky pro payment_settings - admin má plný přístup
CREATE POLICY "admin_read_payment_settings" 
ON payment_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "admin_update_payment_settings" 
ON payment_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);