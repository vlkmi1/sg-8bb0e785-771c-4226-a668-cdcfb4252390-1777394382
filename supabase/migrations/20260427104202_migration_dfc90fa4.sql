-- Opravit viral-videos bucket
DROP POLICY IF EXISTS "Anyone can view viral videos" ON storage.objects;
DROP POLICY IF EXISTS "viral_select" ON storage.objects;

CREATE POLICY "viral_select_own" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'viral-videos' 
  AND auth.uid() = owner
);