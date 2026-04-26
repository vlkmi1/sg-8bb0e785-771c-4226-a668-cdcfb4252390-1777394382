-- Update admin_settings constraint to include AI video influencer providers
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_provider_check;
ALTER TABLE admin_settings 
ADD CONSTRAINT admin_settings_provider_check 
CHECK (provider IN ('openai', 'anthropic', 'google', 'mistral', 'cohere', 'stability', 'midjourney', 'runwayml', 'pika', 'stability-video', 'heygen', 'd-id', 'synthesia', 'runway-gen2'));