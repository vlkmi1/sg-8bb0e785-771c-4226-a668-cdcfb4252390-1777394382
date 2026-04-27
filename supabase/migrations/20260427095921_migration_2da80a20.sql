-- Opravit api_keys table policies
DROP POLICY IF EXISTS "Users can insert own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own keys" ON public.api_keys;

CREATE POLICY "Users can insert own keys"
ON public.api_keys FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own keys"
ON public.api_keys FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own keys"
ON public.api_keys FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own keys"
ON public.api_keys FOR SELECT
USING ((SELECT auth.uid()) = user_id);