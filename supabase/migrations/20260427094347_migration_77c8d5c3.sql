-- ============================================
-- PHASE 4: CONSOLIDATE DUPLICATE RLS POLICIES (Performance Optimization)
-- ============================================

-- Multiple permissive policies on conversations table - consolidate into single policy
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;

CREATE POLICY "conversations_insert_policy" ON conversations
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Multiple permissive policies on messages table - consolidate
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;

CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- Multiple permissive policies on user_subscriptions - consolidate
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_subscriptions;

CREATE POLICY "subscriptions_select_policy" ON user_subscriptions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_subscriptions;

CREATE POLICY "subscriptions_insert_policy" ON user_subscriptions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Similar consolidation for other tables with duplicate policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;

CREATE POLICY "payments_select_policy" ON payments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;

CREATE POLICY "payments_insert_policy" ON payments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());