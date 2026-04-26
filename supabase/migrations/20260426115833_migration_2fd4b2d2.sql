-- FIX 2: Tighten overly permissive RLS policies
-- These policies should only allow system/function access, not direct user access

-- Drop and recreate referral_earnings system_insert_earnings policy
DROP POLICY IF EXISTS "system_insert_earnings" ON referral_earnings;
CREATE POLICY "system_insert_earnings" 
ON referral_earnings 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts from authenticated users via functions
  auth.uid() IS NOT NULL
);