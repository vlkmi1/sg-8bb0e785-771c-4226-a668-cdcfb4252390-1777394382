-- Drop the problematic policy that references non-existent users table
DROP POLICY IF EXISTS "api_select_assistants" ON assistants;