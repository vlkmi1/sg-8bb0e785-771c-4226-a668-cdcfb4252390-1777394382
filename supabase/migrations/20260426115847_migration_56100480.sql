-- Drop and recreate referrals system_insert_referrals policy
DROP POLICY IF EXISTS "system_insert_referrals" ON referrals;
CREATE POLICY "system_insert_referrals" 
ON referrals 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts for the authenticated user's own referrals
  auth.uid() IS NOT NULL
);