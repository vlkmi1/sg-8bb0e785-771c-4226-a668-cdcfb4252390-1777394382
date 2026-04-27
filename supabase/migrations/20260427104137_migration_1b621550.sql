-- Opravit generated-images bucket (dropnout širokou policy a vytvořit restriktivní)
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "images_select" ON storage.objects;

CREATE POLICY "images_select_own" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' 
  AND auth.uid() = owner
);