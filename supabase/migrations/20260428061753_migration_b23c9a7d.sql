-- Create favorite_prompts table
CREATE TABLE IF NOT EXISTS favorite_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('chat', 'image', 'video', 'voice', 'ad', 'summary', 'general')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_prompts_user_id ON favorite_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_prompts_category ON favorite_prompts(category);
CREATE INDEX IF NOT EXISTS idx_favorite_prompts_is_favorite ON favorite_prompts(is_favorite);

-- RLS policies (T1 - private user data)
ALTER TABLE favorite_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_prompts" ON favorite_prompts
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_insert_own_prompts" ON favorite_prompts
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_update_own_prompts" ON favorite_prompts
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_delete_own_prompts" ON favorite_prompts
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);