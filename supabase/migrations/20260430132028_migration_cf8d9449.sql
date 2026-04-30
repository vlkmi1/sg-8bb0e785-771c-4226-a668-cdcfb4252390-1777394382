-- Vyčištění všech starých RLS politik pro credit_packages
DROP POLICY IF EXISTS "auth_read" ON credit_packages;
DROP POLICY IF EXISTS "public_read" ON credit_packages;
DROP POLICY IF EXISTS "public_read_packages" ON credit_packages;