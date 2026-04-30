-- Vyčištění duplicitních admin politik pro payment_settings
DROP POLICY IF EXISTS "admins_select_payment_settings" ON payment_settings;
DROP POLICY IF EXISTS "admins_update_payment_settings" ON payment_settings;
DROP POLICY IF EXISTS "admins_insert_payment_settings" ON payment_settings;
DROP POLICY IF EXISTS "admins_delete_payment_settings" ON payment_settings;