-- Opravit generated_images table policies
DROP POLICY IF EXISTS "Users can delete own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can view own images" ON public.generated_images;

CREATE POLICY "Users can delete own images"
ON public.generated_images FOR DELETE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own images"
ON public.generated_images FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own images"
ON public.generated_images FOR SELECT
USING ((SELECT auth.uid()) = user_id);