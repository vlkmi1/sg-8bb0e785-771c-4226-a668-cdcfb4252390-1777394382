-- Vymazání všech RLS politik pro subscription_plans
DROP POLICY IF EXISTS "admin_read_all_plans" ON subscription_plans;
DROP POLICY IF EXISTS "authenticated_read_subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "public_read_active_plans" ON subscription_plans;