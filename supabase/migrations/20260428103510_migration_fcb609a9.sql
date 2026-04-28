-- Create payment_settings table for storing payment configuration
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for payment_settings (admin only)
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_payment_settings" ON payment_settings
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "admins_insert_payment_settings" ON payment_settings
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "admins_update_payment_settings" ON payment_settings
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "admins_delete_payment_settings" ON payment_settings
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, description) VALUES
  ('paypal_client_id', '', 'PayPal Client ID pro platby'),
  ('paypal_secret', '', 'PayPal Secret pro autentizaci'),
  ('bank_account', '123456789/0100', 'Číslo bankovního účtu pro QR kódy'),
  ('bank_name', 'Fio banka', 'Název banky'),
  ('payment_methods_enabled', '["paypal","bank_transfer"]', 'Povolené platební metody (JSON array)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_payment_settings_key ON payment_settings(setting_key);
CREATE INDEX idx_payment_settings_active ON payment_settings(is_active);