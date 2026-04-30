-- =====================================================
-- SEED DATA - VLOŽENÍ ZÁKLADNÍCH DAT PO MIGRACI
-- =====================================================
-- Spusť tento skript AFTER complete_migration.sql
-- Vyplní základní nastavení, plány a balíčky

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO subscription_plans (tier, name, price, currency, billing_period, features, modules, credits_included, is_active) VALUES
('free', 'Free', 0.00, 'CZK', 'monthly', 
 '["Přístup k základním AI modelům", "50 kreditů měsíčně", "Omezená historie (7 dní)"]'::jsonb, 
 '["chat"]'::jsonb, 50, true),

('basic', 'Basic', 149.00, 'CZK', 'monthly',
 '["Přístup ke všem AI modelům", "500 kreditů měsíčně", "Historie 30 dní", "Email podpora"]'::jsonb,
 '[]'::jsonb, 500, true),

('pro', 'Pro', 499.00, 'CZK', 'monthly',
 '["Přístup ke všem AI modelům", "2000 kreditů měsíčně", "Neomezená historie", "Prioritní podpora", "API přístup", "Export dat"]'::jsonb,
 '[]'::jsonb, 2000, true),

('business', 'Business', 999.00, 'CZK', 'monthly',
 '["Přístup ke všem AI modelům", "5000 kreditů měsíčně", "Neomezená historie", "Prioritní podpora", "API přístup", "Export dat", "Týmové účty (až 5)", "Custom integrace"]'::jsonb,
 '[]'::jsonb, 5000, true),

('enterprise', 'Enterprise', 2999.00, 'CZK', 'monthly',
 '["Přístup ke všem AI modelům", "20000 kreditů měsíčně", "Neomezená historie", "Prioritní podpora", "API přístup", "Export dat", "Neomezené týmové účty", "SLA garance", "Custom integrace", "Dedikovaný account manager"]'::jsonb,
 '[]'::jsonb, 20000, true);

-- =====================================================
-- 2. CREDIT PACKAGES
-- =====================================================
INSERT INTO credit_packages (name, credits, price, currency, bonus_credits, is_active, display_order) VALUES
('Starter Pack', 200, 100.00, 'CZK', 0, true, 1),
('Popular Pack', 500, 199.00, 'CZK', 0, true, 2),
('Pro Pack', 2000, 699.00, 'CZK', 0, true, 3),
('Business Pack', 5000, 1499.00, 'CZK', 0, true, 4);

-- =====================================================
-- 3. AFFILIATE COMMISSION SETTINGS
-- =====================================================
INSERT INTO admin_commission_settings (payment_type, commission_rate, min_payout_amount) VALUES
('subscription', 20.00, 500.00),
('credits', 15.00, 500.00);

-- =====================================================
-- 4. PAYMENT SETTINGS
-- =====================================================
-- POZOR: PayPal credentials jsou v plaintext - po migraci je doporučeno je znovu nastavit přes admin panel
INSERT INTO payment_settings (setting_key, setting_value, description, is_active) VALUES
('paypal_client_id', 'AZ2D7HIJwkLqCj0o7Sj3c8XNiLae0_ks3hyWAvIT_aEc6vJKz-qpITcDA-hXVrYwuja6R09VVVk3akc4', 'PayPal Client ID pro platby', true),
('paypal_secret', 'EIdyG1oVMgFrtnPtqmeL_XzlHLf_hVl_VR_CG4eY1NaJHP3K0UfIpPwsAVbVxJexnPOyBRhc2r9Olp4M', 'PayPal Secret pro autentizaci', true),
('bank_account', '123456789/0100', 'Číslo bankovního účtu pro QR kódy', true),
('bank_name', 'Fio banka', 'Název banky', true),
('bank_account_number', '1852931010/3030', 'Bank account number for QR code payments', true),
('payment_methods_enabled', '["paypal","bank_transfer"]', 'Povolené platební metody (JSON array)', true),
('stripe_publishable_key', '', 'Stripe Publishable Key', true),
('stripe_secret_key', '', 'Stripe Secret Key', true);

-- =====================================================
-- HOTOVO! Základní data jsou naplněna
-- =====================================================
-- DALŠÍ KROKY:
-- 1. Přidej admin API klíče přes admin panel (bezpečnější než plaintext v SQL)
-- 2. Vytvoř si admin účet a nastav is_admin = true
-- 3. Otestuj všechny funkce