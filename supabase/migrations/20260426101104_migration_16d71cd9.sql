-- Drop and recreate the constraint with fal included
ALTER TABLE admin_settings
  DROP CONSTRAINT IF EXISTS valid_provider;

ALTER TABLE admin_settings
  ADD CONSTRAINT valid_provider 
  CHECK (provider IN (
    'openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai',
    'nano-bannana', 'nano-bannana-pro', 
    'stability', 'midjourney', 'fal',
    'runwayml', 'pika', 'stability-video',
    'heygen', 'd-id', 'synthesia', 'runway-gen2',
    'suno', 'musicgen', 'mubert', 'aiva', 'soundraw',
    'viral-runway', 'viral-pika', 'capcut'
  ));

-- Verify the constraint
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'admin_settings' 
  AND con.contype = 'c';