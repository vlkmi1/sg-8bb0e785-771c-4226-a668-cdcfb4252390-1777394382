-- Add RLS policy to bypass service role requirement for INSERT
CREATE POLICY "bypass_insert_assistants" ON assistants
FOR INSERT 
WITH CHECK (auth.uid() = user_id);