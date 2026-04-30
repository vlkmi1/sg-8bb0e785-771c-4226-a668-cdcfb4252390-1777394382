-- Vyčištění všech starých RLS politik pro subscription_plans
DROP POLICY IF EXISTS "auth_read" ON subscription_plans;
DROP POLICY IF EXISTS "public_read" ON subscription_plans;
DROP POLICY IF EXISTS "public_read_plans" ON subscription_plans;