-- Vymazání všech RLS politik pro credit_packages
DROP POLICY IF EXISTS "admin_read_all_packages" ON credit_packages;
DROP POLICY IF EXISTS "authenticated_read_credit_packages" ON credit_packages;
DROP POLICY IF EXISTS "public_read_active_packages" ON credit_packages;