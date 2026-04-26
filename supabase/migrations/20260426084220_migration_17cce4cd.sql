-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CZK',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]',
  modules JSONB NOT NULL DEFAULT '[]',
  credits_included INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_packages table
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CZK',
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CZK',
  method TEXT NOT NULL CHECK (method IN ('paypal', 'bank_transfer', 'card', 'crypto')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'credits')),
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for subscription_plans (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- RLS policies for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for credit_packages (public read)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_packages" ON credit_packages FOR SELECT USING (is_active = true);

-- RLS policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(reference_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (tier, name, price, billing_period, features, modules, credits_included) VALUES
('free', 'Free', 0, 'monthly', 
  '["Základní AI chat", "10 kreditů měsíčně", "Email podpora"]',
  '["chat"]',
  10
),
('basic', 'Basic', 299, 'monthly',
  '["Všechny AI modely", "100 kreditů měsíčně", "Generování obrázků", "Priority podpora"]',
  '["chat", "image-generation", "social-media"]',
  100
),
('pro', 'Pro', 799, 'monthly',
  '["Všechny funkce Basic", "500 kreditů měsíčně", "Generování videí", "AI Influencer", "Hlasový chat"]',
  '["chat", "image-generation", "video-generation", "voice-chat", "social-media", "ai-influencer"]',
  500
),
('enterprise', 'Enterprise', 1999, 'monthly',
  '["Neomezené kredity", "Všechny moduly", "Dedikovaná podpora", "API přístup", "Vlastní AI modely"]',
  '["chat", "image-generation", "video-generation", "voice-chat", "social-media", "ai-influencer", "music-generation"]',
  999999
);

-- Insert default credit packages
INSERT INTO credit_packages (name, credits, price, bonus_credits, display_order) VALUES
('Starter', 50, 99, 0, 1),
('Popular', 150, 249, 20, 2),
('Best Value', 300, 449, 50, 3),
('Premium', 500, 699, 100, 4),
('Ultimate', 1000, 1199, 250, 5);