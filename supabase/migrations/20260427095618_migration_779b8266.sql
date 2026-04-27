-- Opravit i generated-videos bucket
DROP POLICY IF EXISTS "Anyone can view generated videos" ON storage.objects;

CREATE POLICY "Users can view own generated videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-videos' 
  AND auth.uid() = owner
);