-- Add missing columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100;