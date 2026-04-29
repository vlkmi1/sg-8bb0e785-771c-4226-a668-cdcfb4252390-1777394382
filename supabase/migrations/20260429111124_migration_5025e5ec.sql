-- Přidání RLS policy pro čtení asistentů pomocí userId (pro API endpoint)
CREATE POLICY "api_select_assistants" ON assistants
FOR SELECT
USING (
  -- Vlastník může číst svého asistenta
  auth.uid() = user_id
  OR
  -- API může číst asistenta pokud má platné userId v requestu
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = assistants.user_id
  )
);