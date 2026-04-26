-- Create music_generations table
CREATE TABLE music_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  genre TEXT,
  mood TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  provider TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_music_generations_user_id ON music_generations(user_id);
CREATE INDEX idx_music_generations_status ON music_generations(status);

-- Enable RLS
ALTER TABLE music_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own music" ON music_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own music" ON music_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own music" ON music_generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own music" ON music_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for music
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music-generations', 'music-generations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own music"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-generations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view music"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'music-generations');

CREATE POLICY "Users can delete own music"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-generations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);