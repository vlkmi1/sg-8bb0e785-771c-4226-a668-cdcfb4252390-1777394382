-- Ensure public can read credit packages (they should be public)
DROP POLICY IF EXISTS "public_read" ON credit_packages;
CREATE POLICY "public_read" ON credit_packages FOR SELECT USING (true);

-- Ensure authenticated users can also read
DROP POLICY IF EXISTS "auth_read" ON credit_packages;
CREATE POLICY "auth_read" ON credit_packages FOR SELECT TO authenticated USING (true);