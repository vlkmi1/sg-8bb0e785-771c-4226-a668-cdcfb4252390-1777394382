-- Create generated_images table
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'stability', 'midjourney')),
  model_name TEXT,
  size TEXT DEFAULT '1024x1024',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own images
CREATE POLICY "Users can view own images"
  ON generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON generated_images FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );