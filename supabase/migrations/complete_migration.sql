-- =====================================================
-- KOMPLETNÍ MIGRACE DATABÁZE PRO VLASTNÍ SUPABASE
-- =====================================================
-- Tento skript vytvoří celou databázovou strukturu kAIkus platformy
-- včetně všech tabulek, RLS politik, triggerů a funkcí

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (základní tabulka uživatelů)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  credits INTEGER NOT NULL DEFAULT 100,
  last_sign_in_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- RLS pro profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_insert" ON profiles
FOR INSERT TO public
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_select_public" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE TO public
USING ((SELECT auth.uid()) = id);

-- Trigger pro automatické vytvoření profilu při registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. API_KEYS TABLE
-- =====================================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere')),
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_update" ON api_keys FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 3. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select" ON conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "conversations_delete" ON conversations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 4. MESSAGES TABLE
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = (SELECT auth.uid())
));

CREATE POLICY "messages_insert" ON messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = (SELECT auth.uid())
));

CREATE POLICY "messages_delete" ON messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = (SELECT auth.uid())
));

-- =====================================================
-- 5. GENERATED_IMAGES TABLE
-- =====================================================
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'stability', 'midjourney')),
  model_name TEXT,
  size TEXT DEFAULT '1024x1024',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_images" ON generated_images FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "images_insert" ON generated_images FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "images_delete" ON generated_images FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 6. GENERATED_VIDEOS TABLE
-- =====================================================
CREATE TABLE generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT,
  provider TEXT NOT NULL,
  duration INTEGER DEFAULT 5,
  model_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_videos_user_id ON generated_videos(user_id);
CREATE INDEX idx_videos_created_at ON generated_videos(created_at DESC);

ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select" ON generated_videos FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "videos_insert" ON generated_videos FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "videos_delete" ON generated_videos FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 7. ADMIN_SETTINGS TABLE
-- =====================================================
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'nano-bannana', 'nano-bannana-pro', 'stability', 'midjourney', 'fal', 'runwayml', 'pika', 'stability-video', 'heygen', 'd-id', 'synthesia', 'runway-gen2', 'suno', 'musicgen', 'mubert', 'aiva', 'soundraw', 'viral-runway', 'viral-pika', 'capcut')),
  api_key TEXT NOT NULL,
  model_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  balance NUMERIC(10,2),
  balance_updated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  UNIQUE(provider)
);

CREATE INDEX idx_admin_settings_provider ON admin_settings(provider);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_settings_select" ON admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_insert" ON admin_settings FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));
CREATE POLICY "admin_settings_update" ON admin_settings FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));
CREATE POLICY "admin_settings_delete" ON admin_settings FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));

-- =====================================================
-- 8. CREDIT_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_select" ON credit_transactions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "credit_insert" ON credit_transactions FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- 9. AI_INFLUENCERS TABLE
-- =====================================================
CREATE TABLE ai_influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  voice_type TEXT NOT NULL DEFAULT 'neutral',
  personality TEXT NOT NULL DEFAULT 'professional',
  language TEXT NOT NULL DEFAULT 'cs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_influencers_user_id ON ai_influencers(user_id);

ALTER TABLE ai_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "influencers_select" ON ai_influencers FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_insert" ON ai_influencers FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_update" ON ai_influencers FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "influencers_delete" ON ai_influencers FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 10. INFLUENCER_VIDEOS TABLE
-- =====================================================
CREATE TABLE influencer_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES ai_influencers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script TEXT NOT NULL,
  video_url TEXT,
  audio_url TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_influencer_videos_influencer_id ON influencer_videos(influencer_id);
CREATE INDEX idx_influencer_videos_user_id ON influencer_videos(user_id);
CREATE INDEX idx_influencer_videos_status ON influencer_videos(status);

ALTER TABLE influencer_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "influencer_videos_select" ON influencer_videos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM ai_influencers
  WHERE ai_influencers.id = influencer_videos.influencer_id
  AND ai_influencers.user_id = (SELECT auth.uid())
));

CREATE POLICY "influencer_videos_insert" ON influencer_videos FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM ai_influencers
  WHERE ai_influencers.id = influencer_videos.influencer_id
  AND ai_influencers.user_id = (SELECT auth.uid())
));

CREATE POLICY "influencer_videos_delete" ON influencer_videos FOR DELETE
USING (EXISTS (
  SELECT 1 FROM ai_influencers
  WHERE ai_influencers.id = influencer_videos.influencer_id
  AND ai_influencers.user_id = (SELECT auth.uid())
));

-- =====================================================
-- 11. MUSIC_GENERATIONS TABLE
-- =====================================================
CREATE TABLE music_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  genre TEXT,
  mood TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  provider TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_music_generations_user_id ON music_generations(user_id);
CREATE INDEX idx_music_generations_status ON music_generations(status);

ALTER TABLE music_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "music_select" ON music_generations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_insert" ON music_generations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_update" ON music_generations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "music_delete" ON music_generations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 12. SOCIAL_POSTS TABLE
-- =====================================================
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok')),
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  scheduled_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_time ON social_posts(scheduled_time);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON social_posts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_insert" ON social_posts FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_update" ON social_posts FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_delete" ON social_posts FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 13. SUBSCRIPTION_PLANS TABLE
-- =====================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'business', 'enterprise')),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CZK',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  credits_included INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- =====================================================
-- 14. USER_SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON user_subscriptions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_insert" ON user_subscriptions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_update" ON user_subscriptions FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_delete" ON user_subscriptions FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 15. CREDIT_PACKAGES TABLE
-- =====================================================
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CZK',
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_packages" ON credit_packages FOR SELECT USING (is_active = true);

-- =====================================================
-- 16. PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CZK',
  method TEXT NOT NULL CHECK (method IN ('paypal', 'bank_transfer', 'card', 'crypto')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'credits')),
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(reference_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON payments FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 17. VOICE_CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  response_text TEXT,
  response_audio_url TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX idx_voice_conversations_created_at ON voice_conversations(created_at DESC);

ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voice_conversations_select" ON voice_conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_insert" ON voice_conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_update" ON voice_conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "voice_conversations_delete" ON voice_conversations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 18. ASSISTANTS TABLE
-- =====================================================
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  personality TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4',
  avatar_emoji TEXT DEFAULT '🤖',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assistants_user_id ON assistants(user_id);
CREATE INDEX idx_assistants_is_public ON assistants(is_public);

ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistants_select_own" ON assistants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assistants_insert_own" ON assistants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assistants_update_own" ON assistants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "assistants_delete_own" ON assistants FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 19. ASSISTANT_CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assistant_conversations_assistant_id ON assistant_conversations(assistant_id);
CREATE INDEX idx_assistant_conversations_user_id ON assistant_conversations(user_id);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_conv_select" ON assistant_conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM assistants
  WHERE assistants.id = assistant_conversations.assistant_id
  AND assistants.user_id = (SELECT auth.uid())
));

CREATE POLICY "assistant_conv_insert" ON assistant_conversations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM assistants
  WHERE assistants.id = assistant_conversations.assistant_id
  AND assistants.user_id = (SELECT auth.uid())
));

CREATE POLICY "assistant_conv_update" ON assistant_conversations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM assistants
  WHERE assistants.id = assistant_conversations.assistant_id
  AND assistants.user_id = (SELECT auth.uid())
));

CREATE POLICY "assistant_conv_delete" ON assistant_conversations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM assistants
  WHERE assistants.id = assistant_conversations.assistant_id
  AND assistants.user_id = (SELECT auth.uid())
));

-- =====================================================
-- 20. VIRAL_VIDEOS TABLE
-- =====================================================
CREATE TABLE viral_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  trend VARCHAR(100),
  style VARCHAR(100),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'reels', 'shorts')),
  duration INTEGER NOT NULL CHECK (duration IN (15, 30, 60)),
  effects TEXT[],
  provider VARCHAR(50) NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_viral_videos_user_id ON viral_videos(user_id);
CREATE INDEX idx_viral_videos_status ON viral_videos(status);
CREATE INDEX idx_viral_videos_platform ON viral_videos(platform);
CREATE INDEX idx_viral_videos_created_at ON viral_videos(created_at DESC);

ALTER TABLE viral_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viral_videos_select" ON viral_videos FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "viral_videos_insert" ON viral_videos FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "viral_videos_delete" ON viral_videos FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 21. SOCIAL_ACCOUNTS TABLE
-- =====================================================
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok')),
  account_name TEXT NOT NULL,
  access_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, account_name)
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts_select" ON social_accounts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_insert" ON social_accounts FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_update" ON social_accounts FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "social_accounts_delete" ON social_accounts FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 22. REFERRAL_CODES TABLE
-- =====================================================
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_codes_select" ON referral_codes FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "referral_codes_insert" ON referral_codes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "referral_codes_update" ON referral_codes FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 23. REFERRALS TABLE
-- =====================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  total_spent NUMERIC(10,2) DEFAULT 0,
  commission_earned NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON referrals FOR SELECT
USING (((SELECT auth.uid()) = referrer_id) OR ((SELECT auth.uid()) = referred_user_id));

CREATE POLICY "system_insert_referrals" ON referrals FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- 24. REFERRAL_EARNINGS TABLE
-- =====================================================
CREATE TABLE referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'credits', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_earnings_referrer ON referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_referred_user_id ON referral_earnings(referred_user_id);
CREATE INDEX idx_referral_earnings_payment_id ON referral_earnings(payment_id);

ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earnings_select" ON referral_earnings FOR SELECT USING ((SELECT auth.uid()) = referrer_id);
CREATE POLICY "earnings_insert" ON referral_earnings FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- 25. REFERRAL_PAYOUTS TABLE
-- =====================================================
CREATE TABLE referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'credits')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  bank_account TEXT,
  paypal_email TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_payouts_user ON referral_payouts(user_id);
CREATE INDEX idx_referral_payouts_processed_by ON referral_payouts(processed_by);

ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_payouts" ON referral_payouts FOR SELECT
USING (((SELECT auth.uid()) = user_id) OR (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true
)));

CREATE POLICY "users_insert_own_payouts" ON referral_payouts FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "admins_update_payouts" ON referral_payouts FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));

-- =====================================================
-- 26. ADMIN_COMMISSION_SETTINGS TABLE
-- =====================================================
CREATE TABLE admin_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'credits')) UNIQUE,
  commission_rate NUMERIC(5,2) NOT NULL,
  min_payout_amount NUMERIC(10,2) DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_settings_select" ON admin_commission_settings FOR SELECT USING (true);

-- =====================================================
-- 27. DOCUMENT_SUMMARIES TABLE
-- =====================================================
CREATE TABLE document_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  summary_level VARCHAR(20) CHECK (summary_level IN ('short', 'medium', 'detailed')),
  model_used VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_summaries_user_id ON document_summaries(user_id);

ALTER TABLE document_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_summaries" ON document_summaries FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_insert_own_summaries" ON document_summaries FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_delete_own_summaries" ON document_summaries FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 28. AD_GENERATIONS TABLE
-- =====================================================
CREATE TABLE ad_generations (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_generations_user_id ON ad_generations(user_id);

ALTER TABLE ad_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_ads" ON ad_generations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_insert_own_ads" ON ad_generations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_delete_own_ads" ON ad_generations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 29. IMAGE_EDITS TABLE
-- =====================================================
CREATE TABLE image_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  edited_image_url TEXT NOT NULL,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('inpaint', 'outpaint', 'variation', 'remove', 'upscale')),
  prompt TEXT,
  mask_data TEXT,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_image_edits_user_id ON image_edits(user_id);
CREATE INDEX idx_image_edits_original ON image_edits(original_image_id);

ALTER TABLE image_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_edits" ON image_edits FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "insert_own_edits" ON image_edits FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "delete_own_edits" ON image_edits FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 30. FAVORITE_PROMPTS TABLE
-- =====================================================
CREATE TABLE favorite_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('chat', 'image', 'video', 'voice', 'ad', 'summary', 'general')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_favorite_prompts_user_id ON favorite_prompts(user_id);
CREATE INDEX idx_favorite_prompts_category ON favorite_prompts(category);
CREATE INDEX idx_favorite_prompts_is_favorite ON favorite_prompts(is_favorite);

ALTER TABLE favorite_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_prompts" ON favorite_prompts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_insert_own_prompts" ON favorite_prompts FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_update_own_prompts" ON favorite_prompts FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "authenticated_delete_own_prompts" ON favorite_prompts FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 31. API_USAGE_STATS TABLE
-- =====================================================
CREATE TABLE api_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  request_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_date ON api_usage_stats(date);
CREATE INDEX idx_api_usage_provider_date ON api_usage_stats(provider, date);

ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_usage_stats" ON api_usage_stats FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "system_insert_usage_stats" ON api_usage_stats FOR INSERT WITH CHECK (true);

-- =====================================================
-- 32. PAYMENT_SETTINGS TABLE
-- =====================================================
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_settings_key ON payment_settings(setting_key);
CREATE INDEX idx_payment_settings_active ON payment_settings(is_active);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_payment_settings" ON payment_settings FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "admins_insert_payment_settings" ON payment_settings FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "admins_update_payment_settings" ON payment_settings FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "admins_delete_payment_settings" ON payment_settings FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- =====================================================
-- 33. SYSTEM_LOGS TABLE
-- =====================================================
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level TEXT NOT NULL CHECK (log_level IN ('error', 'warning', 'info', 'success')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_logs" ON system_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "system_insert_logs" ON system_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_delete_logs" ON system_logs FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.is_admin = true));

-- =====================================================
-- HOTOVO! Databáze je připravena
-- =====================================================