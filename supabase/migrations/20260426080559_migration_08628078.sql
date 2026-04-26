-- Create social_accounts table for connected social media accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  account_name TEXT NOT NULL,
  access_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, account_name)
);

-- Create social_posts table
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  content TEXT NOT NULL,
  image_url TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for social_accounts
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_accounts" ON social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_accounts" ON social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_accounts" ON social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_accounts" ON social_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for social_posts
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_posts" ON social_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_posts" ON social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_posts" ON social_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_posts" ON social_posts FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_time ON social_posts(scheduled_time);