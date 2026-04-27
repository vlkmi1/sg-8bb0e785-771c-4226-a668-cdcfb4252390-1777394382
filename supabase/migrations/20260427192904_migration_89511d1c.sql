-- Drop duplicate INSERT policies and create single optimized one
DROP POLICY IF EXISTS "auth_insert_own_images" ON generated_images;
DROP POLICY IF EXISTS "images_insert" ON generated_images;

-- Create single optimized INSERT policy
CREATE POLICY "authenticated_insert_images" ON generated_images
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);