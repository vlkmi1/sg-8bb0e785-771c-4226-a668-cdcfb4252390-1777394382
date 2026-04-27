-- messages - smazat všechny staré policies a vytvořit jen 3 optimalizované
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = (SELECT auth.uid())
  )
);