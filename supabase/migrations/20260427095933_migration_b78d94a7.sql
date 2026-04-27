-- Opravit conversations table policies
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can insert own conversations"
ON public.conversations FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING ((SELECT auth.uid()) = user_id);