/*
  # Setup automatic Solana payment checker via pg_cron

  ## Summary
  Enables background automatic payment verification for pending orders.

  ## What this does
  1. Enables pg_cron and pg_net extensions
  2. Creates a cron job that runs every 2 minutes
  3. The cron job calls the check-pending-payments edge function
  4. This ensures payments are confirmed even if customer closes the browser

  ## Why this is needed
  Previously payments were only verified when the customer had the checkout
  page open in their browser. If they closed it, the payment was never
  automatically confirmed.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('check-pending-solana-payments')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-pending-solana-payments'
);

SELECT cron.schedule(
  'check-pending-solana-payments',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/check-pending-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
