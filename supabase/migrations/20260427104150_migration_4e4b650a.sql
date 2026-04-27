-- Opravit music-generations bucket
DROP POLICY IF EXISTS "Anyone can view music" ON storage.objects;
DROP POLICY IF EXISTS "music_select" ON storage.objects;

CREATE POLICY "music_select_own" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-generations' 
  AND auth.uid() = owner
);