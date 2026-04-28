-- Create api_usage_stats table for tracking API requests
CREATE TABLE IF NOT EXISTS api_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'chat', 'image', 'video', 'audio', etc.
  request_count INTEGER NOT NULL DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10,4) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_api_usage_provider_date ON api_usage_stats(provider, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage_stats(date);

-- RLS policies for api_usage_stats (admin only)
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_usage_stats" ON api_usage_stats
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = (select auth.uid()) 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "system_insert_usage_stats" ON api_usage_stats
FOR INSERT
TO public
WITH CHECK (true); -- Allow system to insert stats