-- Dropnout obě funkce a vytvořit znovu se search_path
DROP FUNCTION IF EXISTS public.process_referral(uuid, text);
DROP FUNCTION IF EXISTS public.increment_referral_click(text);

-- Vytvořit process_referral se search_path
CREATE OR REPLACE FUNCTION public.process_referral(new_user_id uuid, ref_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  -- Získat ID referrera
  SELECT user_id INTO referrer_uuid FROM referral_codes WHERE code = ref_code AND is_active = true;
  
  -- Pokud referrer existuje a není to ten samý uživatel
  IF referrer_uuid IS NOT NULL AND referrer_uuid != new_user_id THEN
    -- Vytvořit záznam o referralu
    INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer_uuid, new_user_id, ref_code, 'active')
    ON CONFLICT (referred_user_id) DO NOTHING;
    
    -- Zvýšit počet konverzí
    UPDATE referral_codes SET conversions = conversions + 1 WHERE code = ref_code;
  END IF;
END;
$$;

-- Vytvořit increment_referral_click se search_path
CREATE OR REPLACE FUNCTION public.increment_referral_click(code_val text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE referral_codes SET clicks = clicks + 1 WHERE code = code_val;
END;
$$;