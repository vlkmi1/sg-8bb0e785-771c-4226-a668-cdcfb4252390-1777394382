-- Add balance tracking columns to admin_settings
ALTER TABLE admin_settings 
  ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS balance_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS request_count INTEGER DEFAULT 0;