/*
  # Speed up Solana payment checker cron to every minute

  ## Summary
  Reschedules the background payment checker to run every minute instead of
  every 2 minutes, so customers who close the page get near-instant
  confirmation when their on-chain payment lands.

  ## What this does
  1. Drops any existing 'check-pending-solana-payments' job
  2. Re-creates it with a 1-minute schedule, using vault-stored credentials
     (same pattern as the original 2026-03-25 migration)

  ## Notes
  - Foreground polling in the checkout UI runs every 5 seconds
  - This cron is the safety net for closed-browser scenarios
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-pending-solana-payments') THEN
    PERFORM cron.unschedule('check-pending-solana-payments');
  END IF;
END $$;

SELECT cron.schedule(
  'check-pending-solana-payments',
  '* * * * *',
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
