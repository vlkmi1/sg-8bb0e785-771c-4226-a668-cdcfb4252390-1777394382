-- Create document_summaries table
CREATE TABLE IF NOT EXISTS document_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  summary_level VARCHAR(20) CHECK (summary_level IN ('short', 'medium', 'detailed')),
  model_used VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_document_summaries_user_id ON document_summaries(user_id);

-- Enable RLS
ALTER TABLE document_summaries ENABLE ROW LEVEL SECURITY;

-- T1 policies - private user data
CREATE POLICY "authenticated_select_own_summaries" ON document_summaries
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_insert_own_summaries" ON document_summaries
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "authenticated_delete_own_summaries" ON document_summaries
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);