-- Disable RLS temporarily and insert profile
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Insert profile for the user
INSERT INTO profiles (id, email, full_name, credits, is_admin)
SELECT 
  id,
  'vlk.miroslav@gmail.com',
  'Miroslav Vlk',
  100,
  false
FROM auth.users
WHERE email = 'vlk.miroslav@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  email = 'vlk.miroslav@gmail.com',
  full_name = 'Miroslav Vlk',
  credits = 100;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT id, email, full_name, credits, is_admin
FROM profiles
WHERE email = 'vlk.miroslav@gmail.com';