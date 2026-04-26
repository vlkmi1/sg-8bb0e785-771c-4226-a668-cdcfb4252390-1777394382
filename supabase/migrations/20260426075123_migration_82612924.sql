-- Update admin_settings constraint to include video providers
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_provider_check;
ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_provider_check 
  CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere', 'stability', 'midjourney', 'runwayml', 'pika', 'stability-video'));