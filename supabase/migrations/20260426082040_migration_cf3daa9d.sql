-- Update admin_settings constraint to include nano-bannana and nano-bannana-pro
ALTER TABLE admin_settings
DROP CONSTRAINT IF EXISTS admin_settings_provider_check;

ALTER TABLE admin_settings
ADD CONSTRAINT admin_settings_provider_check
CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere', 'nano-bannana', 'nano-bannana-pro', 'stability', 'midjourney', 'runwayml', 'pika', 'stability-video', 'heygen', 'd-id', 'synthesia', 'runway-gen2'));