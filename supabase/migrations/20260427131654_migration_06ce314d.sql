-- Přidat INSERT policy pro authenticated users na generated_images
CREATE POLICY "authenticated_insert_generated_images" 
ON public.generated_images
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);