-- RLS politiky pro storage.objects - update vlastních souborů
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('generated-images', 'influencer-videos', 'viral-videos', 'audio-files', 'social-media') AND auth.uid() = owner);