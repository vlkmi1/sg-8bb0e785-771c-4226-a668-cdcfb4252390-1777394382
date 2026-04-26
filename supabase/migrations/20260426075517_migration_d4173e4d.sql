-- Create voice_conversations table
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  response_text TEXT,
  response_audio_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX idx_voice_conversations_created_at ON voice_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (T1 - private user data)
CREATE POLICY "select_own_voice" ON voice_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_voice" ON voice_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_voice" ON voice_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_voice" ON voice_conversations FOR DELETE USING (auth.uid() = user_id);

-- Create Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-conversations', 'voice-conversations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Users can upload their own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-conversations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-conversations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-conversations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );