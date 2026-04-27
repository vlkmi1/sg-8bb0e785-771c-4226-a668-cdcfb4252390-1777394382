-- generated_images - smazat staré a vytvořit optimalizované
DROP POLICY IF EXISTS "Users can delete own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can view own images" ON public.generated_images;

CREATE POLICY "images_select" ON public.generated_images FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "images_insert" ON public.generated_images FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "images_delete" ON public.generated_images FOR DELETE USING ((SELECT auth.uid()) = user_id);