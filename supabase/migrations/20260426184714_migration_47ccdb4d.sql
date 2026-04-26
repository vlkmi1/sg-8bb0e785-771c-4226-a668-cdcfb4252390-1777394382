-- Opravit RLS policy pro tabulku messages - použít auth.uid() a zjednodušit
DROP POLICY IF EXISTS messages_insert_own ON messages;
DROP POLICY IF EXISTS messages_select_own ON messages;

-- Nová policy pro INSERT - jednodušší a rychlejší
CREATE POLICY messages_insert_own ON messages
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Nová policy pro SELECT - jednodušší a rychlejší  
CREATE POLICY messages_select_own ON messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );