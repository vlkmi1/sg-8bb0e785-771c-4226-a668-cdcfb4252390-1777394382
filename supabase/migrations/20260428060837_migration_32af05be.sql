-- Create image_edits table
CREATE TABLE IF NOT EXISTS image_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  edited_image_url TEXT NOT NULL,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('inpaint', 'outpaint', 'variation', 'remove', 'upscale')),
  prompt TEXT,
  mask_data TEXT,
  model_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_image_edits_user_id ON image_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_image_edits_original ON image_edits(original_image_id);

-- RLS Policies (T1 - private user data)
ALTER TABLE image_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_edits" ON image_edits
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "insert_own_edits" ON image_edits
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "delete_own_edits" ON image_edits
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);