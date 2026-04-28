-- Fix payments table - rename payment_method to method
ALTER TABLE payments 
  DROP COLUMN IF EXISTS payment_method CASCADE;
  
-- Verify method column exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'method') THEN
    ALTER TABLE payments ADD COLUMN method TEXT NOT NULL DEFAULT 'stripe';
  END IF;
END $$;