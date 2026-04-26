-- Create assistants table
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  personality TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4',
  avatar_emoji TEXT DEFAULT '🤖',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assistant_conversations table
CREATE TABLE assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assistants_user_id ON assistants(user_id);
CREATE INDEX idx_assistants_is_public ON assistants(is_public);
CREATE INDEX idx_assistant_conversations_assistant_id ON assistant_conversations(assistant_id);
CREATE INDEX idx_assistant_conversations_user_id ON assistant_conversations(user_id);

-- Enable RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for assistants
CREATE POLICY "select_own_assistants" ON assistants FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "insert_own_assistants" ON assistants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_assistants" ON assistants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_assistants" ON assistants FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for assistant_conversations
CREATE POLICY "select_own_conversations" ON assistant_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_conversations" ON assistant_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_conversations" ON assistant_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_conversations" ON assistant_conversations FOR DELETE USING (auth.uid() = user_id);