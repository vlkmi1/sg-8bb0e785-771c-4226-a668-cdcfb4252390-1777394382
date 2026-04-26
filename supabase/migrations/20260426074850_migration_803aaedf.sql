-- Create generated_videos table
CREATE TABLE generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT,
  provider TEXT NOT NULL,
  duration INTEGER DEFAULT 5,
  model_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_videos_user_id ON generated_videos(user_id);
CREATE INDEX idx_videos_created_at ON generated_videos(created_at DESC);

-- Enable RLS
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (T1 - Private user data)
CREATE POLICY "select_own_videos" ON generated_videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_videos" ON generated_videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_videos" ON generated_videos
  FOR DELETE USING (auth.uid() = user_id);

-- Create Storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-videos', 'generated-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos
CREATE POLICY "Users can upload their videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );