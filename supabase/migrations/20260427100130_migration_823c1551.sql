-- Opravit assistants table policies
DROP POLICY IF EXISTS "Users can delete own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can insert own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can update own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can view own assistants" ON public.assistants;

CREATE POLICY "Users can delete own assistants"
ON public.assistants FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own assistants"
ON public.assistants FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own assistants"
ON public.assistants FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own assistants"
ON public.assistants FOR SELECT
USING ((SELECT auth.uid()) = user_id);