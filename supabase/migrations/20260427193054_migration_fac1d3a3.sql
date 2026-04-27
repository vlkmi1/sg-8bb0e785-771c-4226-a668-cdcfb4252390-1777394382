-- Fix only existing tables with duplicate policies
-- Based on actual schema

-- api_keys
DROP POLICY IF EXISTS "auth_insert_own_keys" ON api_keys;
DROP POLICY IF EXISTS "keys_insert" ON api_keys;
CREATE POLICY "authenticated_insert_api_keys" ON api_keys
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- conversations
DROP POLICY IF EXISTS "auth_insert_own_conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "authenticated_insert_conversations" ON conversations
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- credit_transactions
DROP POLICY IF EXISTS "auth_insert_own_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "transactions_insert" ON credit_transactions;
CREATE POLICY "authenticated_insert_transactions" ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- generated_videos
DROP POLICY IF EXISTS "auth_insert_own_videos" ON generated_videos;
DROP POLICY IF EXISTS "videos_insert" ON generated_videos;
CREATE POLICY "authenticated_insert_videos" ON generated_videos
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "auth_insert_own_messages" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "authenticated_insert_messages" ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) IN (
    SELECT user_id FROM conversations WHERE id = conversation_id
  )
);

-- music_generations
DROP POLICY IF EXISTS "auth_insert_own_music" ON music_generations;
DROP POLICY IF EXISTS "music_insert" ON music_generations;
CREATE POLICY "authenticated_insert_music" ON music_generations
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- referral_earnings
DROP POLICY IF EXISTS "auth_insert_own_earnings" ON referral_earnings;
DROP POLICY IF EXISTS "earnings_insert" ON referral_earnings;
CREATE POLICY "authenticated_insert_earnings" ON referral_earnings
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = referrer_id);

-- referral_payouts
DROP POLICY IF EXISTS "auth_insert_own_payouts" ON referral_payouts;
DROP POLICY IF EXISTS "payouts_insert" ON referral_payouts;
CREATE POLICY "authenticated_insert_payouts" ON referral_payouts
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- referrals
DROP POLICY IF EXISTS "auth_insert_referrals" ON referrals;
DROP POLICY IF EXISTS "referrals_insert" ON referrals;
CREATE POLICY "authenticated_insert_referrals" ON referrals
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = referrer_id);

-- social_posts
DROP POLICY IF EXISTS "auth_insert_own_posts" ON social_posts;
DROP POLICY IF EXISTS "posts_insert" ON social_posts;
CREATE POLICY "authenticated_insert_posts" ON social_posts
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- user_subscriptions
DROP POLICY IF EXISTS "auth_insert_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON user_subscriptions;
CREATE POLICY "authenticated_insert_subscriptions" ON user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- viral_videos
DROP POLICY IF EXISTS "auth_insert_own_viral_videos" ON viral_videos;
DROP POLICY IF EXISTS "viral_videos_insert" ON viral_videos;
CREATE POLICY "authenticated_insert_viral_videos" ON viral_videos
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);