-- RLS politiky pro storage.objects - delete vlastních souborů
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id IN ('generated-images', 'influencer-videos', 'viral-videos', 'audio-files', 'social-media') AND auth.uid() = owner);