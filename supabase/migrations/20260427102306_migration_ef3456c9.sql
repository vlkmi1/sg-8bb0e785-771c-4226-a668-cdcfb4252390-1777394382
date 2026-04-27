-- social_posts - smazat duplicitní
DROP POLICY IF EXISTS "Users can delete own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.social_posts;
DROP POLICY IF EXISTS "delete_own_posts" ON public.social_posts;
DROP POLICY IF EXISTS "insert_own_posts" ON public.social_posts;
DROP POLICY IF EXISTS "select_own_posts" ON public.social_posts;
DROP POLICY IF EXISTS "update_own_posts" ON public.social_posts;

CREATE POLICY "posts_select" ON public.social_posts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_insert" ON public.social_posts FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_update" ON public.social_posts FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "posts_delete" ON public.social_posts FOR DELETE USING ((SELECT auth.uid()) = user_id);