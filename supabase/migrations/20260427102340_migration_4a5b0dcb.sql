-- assistants - smazat duplicitní
DROP POLICY IF EXISTS "Users can delete own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can insert own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can update own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can view own assistants" ON public.assistants;
DROP POLICY IF EXISTS "delete_own_assistants" ON public.assistants;
DROP POLICY IF EXISTS "insert_own_assistants" ON public.assistants;
DROP POLICY IF EXISTS "select_own_assistants" ON public.assistants;
DROP POLICY IF EXISTS "update_own_assistants" ON public.assistants;

CREATE POLICY "assistants_select" ON public.assistants FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "assistants_insert" ON public.assistants FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "assistants_update" ON public.assistants FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "assistants_delete" ON public.assistants FOR DELETE USING ((SELECT auth.uid()) = user_id);