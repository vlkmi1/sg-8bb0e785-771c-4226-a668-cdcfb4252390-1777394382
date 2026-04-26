-- Update admin_settings constraint to include fal
ALTER TABLE admin_settings
  DROP CONSTRAINT IF EXISTS admin_settings_provider_check;

ALTER TABLE admin_settings
  ADD CONSTRAINT admin_settings_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'nano-bannana', 'nano-bannana-pro', 
                      'stability', 'midjourney', 'fal', 'runwayml', 'pika', 'stability-video', 
                      'heygen', 'd-id', 'synthesia', 'runway-gen2', 
                      'suno', 'musicgen', 'mubert', 'aiva', 'soundraw', 
                      'viral-runway', 'viral-pika', 'capcut'));