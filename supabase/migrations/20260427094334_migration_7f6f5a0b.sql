-- ============================================
-- PHASE 1: FIX CRITICAL SECURITY - SECURITY DEFINER FUNCTIONS
-- ============================================

-- Revoke all public access to SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_set_admin_for_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_signup_credits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) FROM anon, authenticated;

-- Grant back EXECUTE only to authenticated users for user-facing credit functions
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer, text) TO authenticated;

-- Trigger functions (handle_new_user, auto_set_admin_for_email, grant_signup_credits) 
-- remain without EXECUTE grants as they're only called by triggers

-- ============================================
-- PHASE 2: FIX FUNCTION SEARCH_PATH (Security Best Practice)
-- ============================================

-- Add SET search_path to all SECURITY DEFINER functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.auto_set_admin_for_email() SET search_path = public;
ALTER FUNCTION public.grant_signup_credits() SET search_path = public;
ALTER FUNCTION public.deduct_credits(uuid, integer) SET search_path = public;
ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.add_credits(uuid, integer) SET search_path = public;
ALTER FUNCTION public.add_credits(uuid, integer, text) SET search_path = public;

-- ============================================
-- PHASE 3: FIX STORAGE BUCKET POLICIES (Prevent Broad Listing)
-- ============================================

-- Drop the overly permissive SELECT policies on storage.objects
-- These allow anyone to list ALL files in public buckets
DROP POLICY IF EXISTS "Public Access for Generated Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Social Posts Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Influencer Media" ON storage.objects;

-- Recreate with restricted SELECT that prevents listing
-- Users can still ACCESS individual files via URL, but can't list all files
CREATE POLICY "Restricted Public Access for Generated Images" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Restricted Public Access for Social Posts" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'social-posts' AND auth.role() = 'authenticated');

CREATE POLICY "Restricted Public Access for Influencer Media" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'ai-influencer' AND auth.role() = 'authenticated');

-- Keep INSERT/UPDATE/DELETE policies as they were (already properly restricted to authenticated users)