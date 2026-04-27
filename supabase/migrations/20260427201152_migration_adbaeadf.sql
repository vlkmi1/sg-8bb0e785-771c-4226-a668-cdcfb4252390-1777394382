-- Create ad_generations table
CREATE TABLE IF NOT EXISTS ad_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_description TEXT NOT NULL,
  target_audience TEXT,
  platform VARCHAR(50) CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'google', 'tiktok')),
  ad_format VARCHAR(50) CHECK (ad_format IN ('carousel', 'single_image', 'video', 'story')),
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  cta TEXT,
  hashtags TEXT,
  image_suggestions TEXT,
  model_used VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ad_generations_user_id ON ad_generations(user_id);

-- Enable RLS
ALTER TABLE ad_generations ENABLE ROW LEVEL SECURITY;

-- T1 policies - private user data
CREATE POLICY "authenticated_select_own_ads" ON ad_generations
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_insert_own_ads" ON ad_generations
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_delete_own_ads" ON ad_generations
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);