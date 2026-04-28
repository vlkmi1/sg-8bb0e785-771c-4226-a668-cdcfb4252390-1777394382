-- Add is_blocked column to profiles if not exists
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;