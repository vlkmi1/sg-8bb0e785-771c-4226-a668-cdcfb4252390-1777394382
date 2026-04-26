-- Create referral_codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_code UNIQUE(user_id)
);

-- Create referrals table (tracks referred users)
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id)
);

-- Create referral_earnings table (tracks individual commissions)
CREATE TABLE referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'credits', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_payouts table
CREATE TABLE referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'credits')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  bank_account TEXT,
  paypal_email TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_commission_settings table
CREATE TABLE admin_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL UNIQUE CHECK (payment_type IN ('subscription', 'credits')),
  commission_rate DECIMAL(5,2) NOT NULL,
  min_payout_amount DECIMAL(10,2) DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default commission settings
INSERT INTO admin_commission_settings (payment_type, commission_rate, min_payout_amount)
VALUES 
  ('subscription', 20.00, 500.00),
  ('credits', 15.00, 500.00);

-- Create indexes
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referral_earnings_referrer ON referral_earnings(referrer_id);
CREATE INDEX idx_referral_payouts_user ON referral_payouts(user_id);

-- RLS Policies for referral_codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_code" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_code" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrers_select_own_referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "system_insert_referrals" ON referrals
  FOR INSERT WITH CHECK (true);

-- RLS Policies for referral_earnings
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrers_select_own_earnings" ON referral_earnings
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "system_insert_earnings" ON referral_earnings
  FOR INSERT WITH CHECK (true);

-- RLS Policies for referral_payouts
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_payouts" ON referral_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_select_all_payouts" ON referral_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admins_update_payouts" ON referral_payouts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for admin_commission_settings
ALTER TABLE admin_commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON admin_commission_settings
  FOR SELECT USING (true);

CREATE POLICY "admins_manage_settings" ON admin_commission_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code on profile creation
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO referral_codes (user_id, code)
  VALUES (NEW.id, generate_referral_code());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create referral code
DROP TRIGGER IF EXISTS create_referral_code_on_signup ON profiles;
CREATE TRIGGER create_referral_code_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_user();