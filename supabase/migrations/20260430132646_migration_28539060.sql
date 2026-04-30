-- Vytvoření jediné jednoduché politiky pro subscription_plans - čtení pro všechny
CREATE POLICY "allow_read_subscription_plans" 
ON subscription_plans FOR SELECT 
USING (true);