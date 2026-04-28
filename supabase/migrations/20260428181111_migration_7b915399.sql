-- Upravit CHECK constraint aby povoloval i 'business'
ALTER TABLE subscription_plans DROP CONSTRAINT subscription_plans_tier_check;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_tier_check 
CHECK (tier = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text, 'business'::text, 'enterprise'::text]));