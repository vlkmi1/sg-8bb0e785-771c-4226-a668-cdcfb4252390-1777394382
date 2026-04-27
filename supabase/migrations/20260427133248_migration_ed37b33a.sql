-- Optimalizovat stávající images_insert policy
DROP POLICY IF EXISTS "images_insert" ON public.generated_images;

CREATE POLICY "images_insert" 
ON public.generated_images
FOR INSERT 
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);