-- Create simple, working RLS policies for assistants
-- Users can only see their own assistants
CREATE POLICY "assistants_select_own" ON assistants
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own assistants
CREATE POLICY "assistants_insert_own" ON assistants
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own assistants
CREATE POLICY "assistants_update_own" ON assistants
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own assistants
CREATE POLICY "assistants_delete_own" ON assistants
FOR DELETE 
USING (auth.uid() = user_id);