-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level TEXT NOT NULL CHECK (log_level IN ('error', 'warning', 'info', 'success')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- RLS policies for system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "admins_read_logs" ON system_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.is_admin = true
  )
);

-- System can insert logs (public insert for error logging)
CREATE POLICY "system_insert_logs" ON system_logs
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can delete logs
CREATE POLICY "admins_delete_logs" ON system_logs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.is_admin = true
  )
);