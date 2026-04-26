-- Create viral_videos table
CREATE TABLE viral_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  trend VARCHAR(100),
  style VARCHAR(100),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'reels', 'shorts')),
  duration INTEGER NOT NULL CHECK (duration IN (15, 30, 60)),
  effects TEXT[],
  provider VARCHAR(50) NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_viral_videos_user_id ON viral_videos(user_id);
CREATE INDEX idx_viral_videos_status ON viral_videos(status);
CREATE INDEX idx_viral_videos_platform ON viral_videos(platform);
CREATE INDEX idx_viral_videos_created_at ON viral_videos(created_at DESC);

-- Enable RLS
ALTER TABLE viral_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own viral videos"
  ON viral_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create viral videos"
  ON viral_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own viral videos"
  ON viral_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for viral videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('viral-videos', 'viral-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload viral videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'viral-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view viral videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'viral-videos');

CREATE POLICY "Users can delete own viral videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'viral-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );