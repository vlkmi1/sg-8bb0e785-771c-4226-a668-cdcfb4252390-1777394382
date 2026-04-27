-- Opravit messages table policies
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;

CREATE POLICY "Users can delete messages in own conversations"
ON public.messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert messages in own conversations"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can view messages in own conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);