-- Fix user_subscriptions table - rename plan_type to plan_id
ALTER TABLE user_subscriptions 
  DROP COLUMN IF EXISTS plan_type CASCADE;

-- Verify plan_id column exists  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'plan_id') THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan_id TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;