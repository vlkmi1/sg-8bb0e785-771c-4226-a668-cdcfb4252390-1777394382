-- Opravit assistant_conversations table policies
DROP POLICY IF EXISTS "Users can delete conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can insert conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can update conversations with own assistants" ON public.assistant_conversations;
DROP POLICY IF EXISTS "Users can view conversations with own assistants" ON public.assistant_conversations;

CREATE POLICY "Users can delete conversations with own assistants"
ON public.assistant_conversations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert conversations with own assistants"
ON public.assistant_conversations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update conversations with own assistants"
ON public.assistant_conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can view conversations with own assistants"
ON public.assistant_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assistants
    WHERE assistants.id = assistant_conversations.assistant_id
    AND assistants.user_id = (SELECT auth.uid())
  )
);