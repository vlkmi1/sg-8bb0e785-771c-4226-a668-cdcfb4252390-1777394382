-- Create credit transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_view_own_transactions" 
  ON credit_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_transactions" 
  ON credit_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Drop existing views first since we might be recreating them
DROP VIEW IF EXISTS admin_credit_analytics;
DROP VIEW IF EXISTS admin_usage_by_feature;

-- Create views
CREATE OR REPLACE VIEW admin_credit_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credits_added,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as credits_used,
  SUM(amount) as net_credits
FROM credit_transactions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW admin_usage_by_feature AS
SELECT 
  description,
  COUNT(*) as usage_count,
  SUM(ABS(amount)) as total_credits,
  DATE_TRUNC('day', created_at) as date
FROM credit_transactions
WHERE amount < 0
GROUP BY description, DATE_TRUNC('day', created_at)
ORDER BY date DESC, total_credits DESC;

-- Update the deduct_credits RPC to also log the transaction
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INTEGER, description TEXT DEFAULT 'API Usage')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits with lock for update
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = deduct_credits.user_id
  FOR UPDATE;
  
  IF current_credits < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  new_credits := current_credits - amount;
  
  -- Update profile
  UPDATE profiles
  SET credits = new_credits,
      updated_at = NOW()
  WHERE id = deduct_credits.user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, description)
  VALUES (deduct_credits.user_id, -amount, deduct_credits.description);
  
  RETURN new_credits;
END;
$$;

-- Update the add_credits RPC to also log the transaction
CREATE OR REPLACE FUNCTION add_credits(target_user_id UUID, amount INTEGER, description TEXT DEFAULT 'Credits added by admin')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  -- Update profile
  UPDATE profiles
  SET credits = credits + amount,
      updated_at = NOW()
  WHERE id = add_credits.target_user_id
  RETURNING credits INTO new_credits;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, description)
  VALUES (add_credits.target_user_id, amount, add_credits.description);
  
  RETURN new_credits;
END;
$$;