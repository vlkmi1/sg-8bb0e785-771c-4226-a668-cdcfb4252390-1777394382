-- Create ai_influencers table
CREATE TABLE ai_influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  voice_type TEXT NOT NULL DEFAULT 'neutral',
  personality TEXT NOT NULL DEFAULT 'professional',
  language TEXT NOT NULL DEFAULT 'cs',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_videos table
CREATE TABLE influencer_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES ai_influencers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script TEXT NOT NULL,
  video_url TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_influencers
CREATE POLICY "Users can view own influencers"
  ON ai_influencers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own influencers"
  ON ai_influencers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own influencers"
  ON ai_influencers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own influencers"
  ON ai_influencers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for influencer_videos
CREATE POLICY "Users can view own videos"
  ON influencer_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own videos"
  ON influencer_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON influencer_videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON influencer_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Create Storage bucket for influencer videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('influencer-videos', 'influencer-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for influencer-videos bucket
CREATE POLICY "Users can upload own influencer videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'influencer-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own influencer videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'influencer-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own influencer videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'influencer-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes
CREATE INDEX idx_ai_influencers_user_id ON ai_influencers(user_id);
CREATE INDEX idx_influencer_videos_influencer_id ON influencer_videos(influencer_id);
CREATE INDEX idx_influencer_videos_user_id ON influencer_videos(user_id);
CREATE INDEX idx_influencer_videos_status ON influencer_videos(status);