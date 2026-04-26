-- FIX 3: Restrict storage bucket public listing
-- Get current storage policies and tighten them

-- Update storage.objects policies to prevent listing while allowing individual access
DROP POLICY IF EXISTS "Anyone can view generated images" ON storage.objects;
CREATE POLICY "Anyone can view generated images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'generated-images' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Anyone can view generated videos" ON storage.objects;
CREATE POLICY "Anyone can view generated videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'generated-videos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Anyone can view AI influencer content" ON storage.objects;
CREATE POLICY "Anyone can view AI influencer content" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ai-influencer' 
  AND auth.role() = 'authenticated'
);