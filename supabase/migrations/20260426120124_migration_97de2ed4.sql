-- Consolidate referral_payouts duplicate SELECT policies

DROP POLICY IF EXISTS "admins_select_all_payouts" ON referral_payouts;
DROP POLICY IF EXISTS "users_select_own_payouts" ON referral_payouts;

CREATE POLICY "view_payouts" 
ON referral_payouts 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
);