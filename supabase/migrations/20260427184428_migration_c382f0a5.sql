-- Povolit INSERT do generated_images pro authenticated users (anon klíč s JWT tokenem)
DROP POLICY IF EXISTS "anon_insert_images" ON generated_images;

CREATE POLICY "auth_insert_own_images" ON generated_images
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Povolit SELECT vlastních obrázků
DROP POLICY IF EXISTS "select_own_images" ON generated_images;

CREATE POLICY "select_own_images" ON generated_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);