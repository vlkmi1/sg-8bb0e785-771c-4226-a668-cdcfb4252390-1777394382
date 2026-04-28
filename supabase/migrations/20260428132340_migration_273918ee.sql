-- Ensure public can read subscription plans
DROP POLICY IF EXISTS "public_read" ON subscription_plans;
CREATE POLICY "public_read" ON subscription_plans FOR SELECT USING (true);

-- Ensure authenticated users can also read
DROP POLICY IF EXISTS "auth_read" ON subscription_plans;
CREATE POLICY "auth_read" ON subscription_plans FOR SELECT TO authenticated USING (true);