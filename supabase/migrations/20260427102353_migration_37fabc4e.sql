-- assistant_conversations - smazat duplicitní
DROP POLICY IF EXISTS "Users can delete conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can insert conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can update conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can view conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "delete_own_conversations" ON public.assistant_conversations;
DROP POLICY IF EXISTS "insert_own_conversations" ON public.assistant_conversations;
DROP POLICY IF EXISTS "select_own_conversations" ON public.assistant_conversations;
DROP POLICY IF EXISTS "update_own_conversations" ON public.assistant_conversations;

CREATE POLICY "assistant_conv_select" ON public.assistant_conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "assistant_conv_insert" ON public.assistant_conversations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "assistant_conv_update" ON public.assistant_conversations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "assistant_conv_delete" ON public.assistant_conversations FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);