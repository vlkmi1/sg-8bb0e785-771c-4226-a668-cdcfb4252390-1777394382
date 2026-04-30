-- RLS politiky pro storage.objects - upload jen pro autentizované uživatele
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('generated-images', 'influencer-videos', 'viral-videos', 'audio-files', 'social-media') AND auth.role() = 'authenticated');