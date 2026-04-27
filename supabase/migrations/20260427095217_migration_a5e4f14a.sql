-- Dropnout a znovu vytvořit view s SECURITY INVOKER a SPRÁVNOU definicí
DROP VIEW IF EXISTS public.admin_usage_by_feature;

CREATE VIEW public.admin_usage_by_feature
WITH (security_invoker=on)
AS
SELECT 
  description,
  COUNT(*) AS usage_count,
  SUM(ABS(amount)) AS total_credits,
  DATE_TRUNC('day'::text, created_at) AS date
FROM credit_transactions
WHERE amount < 0
GROUP BY description, DATE_TRUNC('day'::text, created_at)
ORDER BY DATE_TRUNC('day'::text, created_at) DESC, SUM(ABS(amount)) DESC;