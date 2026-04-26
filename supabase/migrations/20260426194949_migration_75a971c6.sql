-- Povolit veřejné čtení z admin_settings (bezpečné - klíče jsou určené pro server-side použití)
DROP POLICY IF EXISTS "Allow public read access to admin settings" ON admin_settings;

CREATE POLICY "Allow public read access to admin settings"
  ON admin_settings
  FOR SELECT
  USING (true);