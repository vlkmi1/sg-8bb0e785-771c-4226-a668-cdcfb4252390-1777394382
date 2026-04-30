-- ============================================
-- KOMPLETNÍ DATA PRO EXTERNÍ SUPABASE
-- Spusť tento script v supabase.com SQL Editoru
-- ============================================

-- 1. SUBSCRIPTION PLANS
INSERT INTO subscription_plans (tier, name, price, currency, credits_included, billing_period, features, is_active)
VALUES 
  ('free', 'Free', 0, 'CZK', 100, 'monthly', '["Základní AI modely", "100 kreditů/měsíc", "Komunitní podpora"]', true),
  ('basic', 'Basic', 149, 'CZK', 1000, 'monthly', '["Všechny AI modely", "1000 kreditů/měsíc", "Email podpora", "Základní nástroje"]', true),
  ('pro', 'Pro', 499, 'CZK', 5000, 'monthly', '["Všechny AI modely", "5000 kreditů/měsíc", "Prioritní podpora", "Pokročilé nástroje", "API přístup"]', true),
  ('business', 'Business', 999, 'CZK', 15000, 'monthly', '["Všechny AI modely", "15000 kreditů/měsíc", "VIP podpora", "Všechny nástroje", "API přístup", "Týmové funkce"]', true),
  ('enterprise', 'Enterprise', 2999, 'CZK', 999999, 'monthly', '["Neomezené kredity", "Dedikovaný support", "Custom integrace", "SLA garance", "Vlastní AI trénink"]', true)
ON CONFLICT (tier) 
DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  credits_included = EXCLUDED.credits_included,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- 2. CREDIT PACKAGES
INSERT INTO credit_packages (name, credits, price, currency, bonus_credits, display_order, is_active)
VALUES
  ('Starter', 500, 99, 'CZK', 0, 1, true),
  ('Popular', 1500, 249, 'CZK', 100, 2, true),
  ('Pro Pack', 3000, 449, 'CZK', 300, 3, true),
  ('Business Pack', 10000, 1299, 'CZK', 1500, 4, true)
ON CONFLICT (name)
DO UPDATE SET
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  bonus_credits = EXCLUDED.bonus_credits,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 3. PAYMENT SETTINGS
INSERT INTO payment_settings (setting_key, setting_value, description, is_active)
VALUES
  ('paypal_enabled', 'true', 'Enable PayPal payments', true),
  ('paypal_client_id', '', 'PayPal Client ID', true),
  ('paypal_secret', '', 'PayPal Secret Key', true),
  ('stripe_enabled', 'false', 'Enable Stripe payments', true),
  ('stripe_publishable_key', '', 'Stripe Publishable Key', true),
  ('stripe_secret_key', '', 'Stripe Secret Key', true),
  ('bank_transfer_enabled', 'true', 'Enable bank transfer', true),
  ('bank_account_number', '', 'Bank account number', true),
  ('bank_name', 'Fio banka', 'Bank name', true),
  ('payment_methods_enabled', 'paypal,bank_transfer', 'Comma-separated list of enabled payment methods', true)
ON CONFLICT (setting_key)
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 4. AFFILIATE COMMISSION SETTINGS
INSERT INTO admin_commission_settings (payment_type, commission_rate, min_payout_amount)
VALUES
  ('subscription', 20.00, 500.00),
  ('credits', 15.00, 500.00)
ON CONFLICT (payment_type)
DO UPDATE SET
  commission_rate = EXCLUDED.commission_rate,
  min_payout_amount = EXCLUDED.min_payout_amount;

-- 5. OVĚŘENÍ DAT
SELECT 'Subscription Plans:' as table_name, COUNT(*) as count FROM subscription_plans WHERE is_active = true
UNION ALL
SELECT 'Credit Packages:', COUNT(*) FROM credit_packages WHERE is_active = true
UNION ALL
SELECT 'Payment Settings:', COUNT(*) FROM payment_settings WHERE is_active = true
UNION ALL
SELECT 'Commission Settings:', COUNT(*) FROM admin_commission_settings;