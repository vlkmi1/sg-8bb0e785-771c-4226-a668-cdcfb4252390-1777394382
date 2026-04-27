-- ============================================
-- CREATE INDEXES ON ALL FOREIGN KEY COLUMNS
-- This addresses the "Unindexed foreign keys" linter suggestions
-- ============================================

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Assistant Conversations
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_assistant_id ON assistant_conversations(assistant_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Credit Transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Generated Images
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);

-- Generated Videos
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON generated_videos(user_id);

-- Influencer Videos
CREATE INDEX IF NOT EXISTS idx_influencer_videos_influencer_id ON influencer_videos(influencer_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Referral Codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);

-- Referral Earnings (multiple foreign keys)
CREATE INDEX IF NOT EXISTS idx_referral_earnings_payment_id ON referral_earnings(payment_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_user_id ON referral_earnings(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);

-- Referral Payouts (multiple foreign keys)
CREATE INDEX IF NOT EXISTS idx_referral_payouts_processed_by ON referral_payouts(processed_by);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON referral_payouts(user_id);

-- Referrals (multiple foreign keys)
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Social Accounts
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);

-- User Subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- Voice Conversations
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user_id ON voice_conversations(user_id);