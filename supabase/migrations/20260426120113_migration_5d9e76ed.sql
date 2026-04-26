-- FIX 6: Consolidate duplicate SELECT policies
-- credit_transactions has 2 SELECT policies, consolidate into one

DROP POLICY IF EXISTS "admins_view_all_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "users_view_own_transactions" ON credit_transactions;

CREATE POLICY "view_transactions" 
ON credit_transactions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
);