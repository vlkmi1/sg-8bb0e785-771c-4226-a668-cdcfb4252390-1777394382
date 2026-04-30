-- RLS politiky pro storage.objects - povolení čtení všem
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('generated-images', 'influencer-videos', 'viral-videos', 'audio-files', 'social-media'));