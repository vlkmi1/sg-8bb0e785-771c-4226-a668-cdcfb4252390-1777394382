-- Add credits column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100 NOT NULL;

-- Create function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = user_id;
  
  -- Check if user has enough credits
  IF current_credits < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET credits = credits - amount
  WHERE id = user_id
  RETURNING credits INTO current_credits;
  
  RETURN current_credits;
END;
$$;

-- Create function to add credits (admin only)
CREATE OR REPLACE FUNCTION add_credits(target_user_id UUID, amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT is_admin INTO caller_is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only admins can add credits';
  END IF;
  
  -- Add credits
  UPDATE profiles
  SET credits = credits + amount
  WHERE id = target_user_id
  RETURNING credits INTO current_credits;
  
  RETURN current_credits;
END;
$$;