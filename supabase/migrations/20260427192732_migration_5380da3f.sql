-- Fix auth RLS initialization for all tables with auth.uid() policies
-- This improves query performance by evaluating auth.uid() only once per query

-- generated_images
DROP POLICY IF EXISTS "auth_insert_own_images" ON generated_images;
CREATE POLICY "auth_insert_own_images" ON generated_images
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "select_own_images" ON generated_images;
CREATE POLICY "select_own_images" ON generated_images
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- profiles
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE
TO public
USING ((select auth.uid()) = id);

-- api_keys
DROP POLICY IF EXISTS "api_keys_select" ON api_keys;
CREATE POLICY "api_keys_select" ON api_keys
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "api_keys_insert" ON api_keys;
CREATE POLICY "api_keys_insert" ON api_keys
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "api_keys_update" ON api_keys;
CREATE POLICY "api_keys_update" ON api_keys
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "api_keys_delete" ON api_keys;
CREATE POLICY "api_keys_delete" ON api_keys
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- conversations
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "conversations_delete" ON conversations;
CREATE POLICY "conversations_delete" ON conversations
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (select auth.uid())
  )
);

-- credit_transactions
DROP POLICY IF EXISTS "credit_select" ON credit_transactions;
CREATE POLICY "credit_select" ON credit_transactions
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "credit_insert" ON credit_transactions;
CREATE POLICY "credit_insert" ON credit_transactions
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) IS NOT NULL);

-- generated_videos
DROP POLICY IF EXISTS "videos_select" ON generated_videos;
CREATE POLICY "videos_select" ON generated_videos
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "videos_insert" ON generated_videos;
CREATE POLICY "videos_insert" ON generated_videos
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "videos_delete" ON generated_videos;
CREATE POLICY "videos_delete" ON generated_videos
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- music_generations
DROP POLICY IF EXISTS "music_select" ON music_generations;
CREATE POLICY "music_select" ON music_generations
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "music_insert" ON music_generations;
CREATE POLICY "music_insert" ON music_generations
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "music_update" ON music_generations;
CREATE POLICY "music_update" ON music_generations
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "music_delete" ON music_generations;
CREATE POLICY "music_delete" ON music_generations
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- social_posts
DROP POLICY IF EXISTS "posts_select" ON social_posts;
CREATE POLICY "posts_select" ON social_posts
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_insert" ON social_posts;
CREATE POLICY "posts_insert" ON social_posts
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_update" ON social_posts;
CREATE POLICY "posts_update" ON social_posts
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts_delete" ON social_posts;
CREATE POLICY "posts_delete" ON social_posts
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- ai_influencers
DROP POLICY IF EXISTS "influencers_select" ON ai_influencers;
CREATE POLICY "influencers_select" ON ai_influencers
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "influencers_insert" ON ai_influencers;
CREATE POLICY "influencers_insert" ON ai_influencers
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "influencers_update" ON ai_influencers;
CREATE POLICY "influencers_update" ON ai_influencers
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "influencers_delete" ON ai_influencers;
CREATE POLICY "influencers_delete" ON ai_influencers
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- influencer_videos
DROP POLICY IF EXISTS "influencer_videos_select" ON influencer_videos;
CREATE POLICY "influencer_videos_select" ON influencer_videos
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "influencer_videos_insert" ON influencer_videos;
CREATE POLICY "influencer_videos_insert" ON influencer_videos
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "influencer_videos_delete" ON influencer_videos;
CREATE POLICY "influencer_videos_delete" ON influencer_videos
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM ai_influencers
    WHERE ai_influencers.id = influencer_videos.influencer_id
    AND ai_influencers.user_id = (select auth.uid())
  )
);

-- user_subscriptions
DROP POLICY IF EXISTS "subscriptions_select" ON user_subscriptions;
CREATE POLICY "subscriptions_select" ON user_subscriptions
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "subscriptions_insert" ON user_subscriptions;
CREATE POLICY "subscriptions_insert" ON user_subscriptions
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "subscriptions_update" ON user_subscriptions;
CREATE POLICY "subscriptions_update" ON user_subscriptions
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "subscriptions_delete" ON user_subscriptions;
CREATE POLICY "subscriptions_delete" ON user_subscriptions
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- assistants
DROP POLICY IF EXISTS "assistants_select" ON assistants;
CREATE POLICY "assistants_select" ON assistants
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assistants_insert" ON assistants;
CREATE POLICY "assistants_insert" ON assistants
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assistants_update" ON assistants;
CREATE POLICY "assistants_update" ON assistants
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assistants_delete" ON assistants;
CREATE POLICY "assistants_delete" ON assistants
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- referrals
DROP POLICY IF EXISTS "system_insert_referrals" ON referrals;
CREATE POLICY "system_insert_referrals" ON referrals
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals
FOR SELECT
TO public
USING (((select auth.uid()) = referrer_id) OR ((select auth.uid()) = referred_user_id));

-- referral_earnings
DROP POLICY IF EXISTS "earnings_select" ON referral_earnings;
CREATE POLICY "earnings_select" ON referral_earnings
FOR SELECT
TO public
USING ((select auth.uid()) = referrer_id);

DROP POLICY IF EXISTS "earnings_insert" ON referral_earnings;
CREATE POLICY "earnings_insert" ON referral_earnings
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) IS NOT NULL);

-- referral_payouts
DROP POLICY IF EXISTS "view_payouts" ON referral_payouts;
CREATE POLICY "view_payouts" ON referral_payouts
FOR SELECT
TO public
USING (((select auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true)))));

DROP POLICY IF EXISTS "users_insert_own_payouts" ON referral_payouts;
CREATE POLICY "users_insert_own_payouts" ON referral_payouts
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "admins_update_payouts" ON referral_payouts;
CREATE POLICY "admins_update_payouts" ON referral_payouts
FOR UPDATE
TO public
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true))));

-- voice_conversations
DROP POLICY IF EXISTS "voice_conversations_select" ON voice_conversations;
CREATE POLICY "voice_conversations_select" ON voice_conversations
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "voice_conversations_insert" ON voice_conversations;
CREATE POLICY "voice_conversations_insert" ON voice_conversations
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "voice_conversations_update" ON voice_conversations;
CREATE POLICY "voice_conversations_update" ON voice_conversations
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "voice_conversations_delete" ON voice_conversations;
CREATE POLICY "voice_conversations_delete" ON voice_conversations
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- viral_videos
DROP POLICY IF EXISTS "viral_videos_select" ON viral_videos;
CREATE POLICY "viral_videos_select" ON viral_videos
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "viral_videos_insert" ON viral_videos;
CREATE POLICY "viral_videos_insert" ON viral_videos
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "viral_videos_delete" ON viral_videos;
CREATE POLICY "viral_videos_delete" ON viral_videos
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- social_accounts
DROP POLICY IF EXISTS "social_accounts_select" ON social_accounts;
CREATE POLICY "social_accounts_select" ON social_accounts
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "social_accounts_insert" ON social_accounts;
CREATE POLICY "social_accounts_insert" ON social_accounts
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "social_accounts_update" ON social_accounts;
CREATE POLICY "social_accounts_update" ON social_accounts
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "social_accounts_delete" ON social_accounts;
CREATE POLICY "social_accounts_delete" ON social_accounts
FOR DELETE
TO public
USING ((select auth.uid()) = user_id);

-- referral_codes
DROP POLICY IF EXISTS "referral_codes_select" ON referral_codes;
CREATE POLICY "referral_codes_select" ON referral_codes
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "referral_codes_insert" ON referral_codes;
CREATE POLICY "referral_codes_insert" ON referral_codes
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "referral_codes_update" ON referral_codes;
CREATE POLICY "referral_codes_update" ON referral_codes
FOR UPDATE
TO public
USING ((select auth.uid()) = user_id);

-- payments
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments
FOR SELECT
TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments
FOR INSERT
TO public
WITH CHECK ((select auth.uid()) = user_id);

-- assistant_conversations
DROP POLICY IF EXISTS "assistant_conv_select" ON assistant_conversations;
CREATE POLICY "assistant_conv_select" ON assistant_conversations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "assistant_conv_insert" ON assistant_conversations;
CREATE POLICY "assistant_conv_insert" ON assistant_conversations
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "assistant_conv_update" ON assistant_conversations;
CREATE POLICY "assistant_conv_update" ON assistant_conversations
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "assistant_conv_delete" ON assistant_conversations;
CREATE POLICY "assistant_conv_delete" ON assistant_conversations
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (select auth.uid())
  )
);

-- admin_settings policies with admin check
DROP POLICY IF EXISTS "admin_settings_insert" ON admin_settings;
CREATE POLICY "admin_settings_insert" ON admin_settings
FOR INSERT
TO public
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true))));

DROP POLICY IF EXISTS "admin_settings_update" ON admin_settings;
CREATE POLICY "admin_settings_update" ON admin_settings
FOR UPDATE
TO public
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true))));

DROP POLICY IF EXISTS "admin_settings_delete" ON admin_settings;
CREATE POLICY "admin_settings_delete" ON admin_settings
FOR DELETE
TO public
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_admin = true))));