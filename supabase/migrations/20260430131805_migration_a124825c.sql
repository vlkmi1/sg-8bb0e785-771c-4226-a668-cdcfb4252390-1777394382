-- Smazání starých RLS politik
DROP POLICY IF EXISTS "public_read_subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "public_read_credit_packages" ON credit_packages;