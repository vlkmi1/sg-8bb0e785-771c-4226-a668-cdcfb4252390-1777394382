-- Opravit profiles table policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING ((SELECT auth.uid()) = id);