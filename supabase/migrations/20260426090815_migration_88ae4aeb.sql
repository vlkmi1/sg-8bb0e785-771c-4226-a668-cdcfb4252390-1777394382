-- Create function to auto-set admin for specific email
CREATE OR REPLACE FUNCTION auto_set_admin_for_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the email matches the admin email
  IF NEW.email = 'vlk.miroslav@gmail.com' THEN
    NEW.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs before insert on profiles
DROP TRIGGER IF EXISTS set_admin_on_profile_create ON profiles;
CREATE TRIGGER set_admin_on_profile_create
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_admin_for_email();

-- Also update existing profile if it exists
UPDATE profiles 
SET is_admin = true, updated_at = NOW()
WHERE email = 'vlk.miroslav@gmail.com';

-- Verify setup
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'vlk.miroslav@gmail.com' AND is_admin = true)
    THEN 'Admin práva byla nastavena pro existující účet'
    ELSE 'Trigger vytvořen - admin práva se nastaví automaticky při první registraci'
  END as status;