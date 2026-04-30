-- Vytvoření RLS politiky pro čtení subscription_plans (veřejné čtení)
DROP POLICY IF EXISTS "public_read_subscription_plans" ON subscription_plans;
CREATE POLICY "public_read_subscription_plans" 
ON subscription_plans FOR SELECT 
USING (is_active = true);