/*
  # Schedule periodic sweep of deposit addresses

  1. Scheduled Jobs
    - `sweep-payments-every-3-min` - calls the `sweep-payments` edge function every 3 minutes
      using pg_net. Scans pending orders, confirms any that received payment, and sweeps
      funds to the main wallet.

  2. Notes
    - Uses the project URL and service role key stored as vault secrets so nothing is
      hardcoded in this migration.
    - Job is idempotent; re-running this migration unschedules any existing job first.
*/

DO $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('sweep-payments-every-3-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sweep-payments-every-3-min',
  '*/3 * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1) || '/functions/v1/sweep-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);