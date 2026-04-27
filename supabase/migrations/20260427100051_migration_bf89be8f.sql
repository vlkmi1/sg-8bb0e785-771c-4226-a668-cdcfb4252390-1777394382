-- Opravit social_posts table policies
DROP POLICY IF EXISTS "Users can delete own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.social_posts;

CREATE POLICY "Users can delete own posts"
ON public.social_posts FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own posts"
ON public.social_posts FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own posts"
ON public.social_posts FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own posts"
ON public.social_posts FOR SELECT
USING ((SELECT auth.uid()) = user_id);