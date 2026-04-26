-- Update platform enum constraint in social_accounts to include youtube and tiktok
ALTER TABLE social_accounts 
DROP CONSTRAINT IF EXISTS social_accounts_platform_check;

ALTER TABLE social_accounts 
ADD CONSTRAINT social_accounts_platform_check 
CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok'));

-- Update platform enum constraint in social_posts to include youtube and tiktok
ALTER TABLE social_posts 
DROP CONSTRAINT IF EXISTS social_posts_platform_check;

ALTER TABLE social_posts 
ADD CONSTRAINT social_posts_platform_check 
CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok'));