-- Vyčištění všech RLS politik a vytvoření jednoduchých
DROP POLICY IF EXISTS "public_and_admin_read_subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "public_and_admin_read_credit_packages" ON credit_packages;
DROP POLICY IF EXISTS "admin_read_payment_settings" ON payment_settings;
DROP POLICY IF EXISTS "admin_update_payment_settings" ON payment_settings;