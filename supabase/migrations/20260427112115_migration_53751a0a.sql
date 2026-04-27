-- Dropnout duplicitní indexy (ponechat ty s kratším názvem)
-- generated_videos
DROP INDEX IF EXISTS public.idx_videos_user_id;

-- referral_codes
DROP INDEX IF EXISTS public.idx_referral_codes_user_id;

-- referral_earnings  
DROP INDEX IF EXISTS public.idx_referral_earnings_referrer_id;

-- referral_payouts
DROP INDEX IF EXISTS public.idx_referral_payouts_referrer_id;

-- referrals (2 duplicitní páry)
DROP INDEX IF EXISTS public.idx_referrals_referred_user_id;
DROP INDEX IF EXISTS public.idx_referrals_referrer_id;