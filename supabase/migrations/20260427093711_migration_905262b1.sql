-- Dropnout starý view a vytvořit nový s SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_credit_analytics;

CREATE VIEW public.admin_credit_analytics
WITH (security_invoker=on)
AS
SELECT 
  date_trunc('day'::text, created_at) AS date,
  count(*) AS transaction_count,
  sum(
    CASE
      WHEN amount > 0 THEN amount
      ELSE 0
    END) AS credits_added,
  sum(
    CASE
      WHEN amount < 0 THEN abs(amount)
      ELSE 0
    END) AS credits_used,
  sum(amount) AS net_credits
FROM credit_transactions
GROUP BY date_trunc('day'::text, created_at)
ORDER BY date_trunc('day'::text, created_at) DESC;