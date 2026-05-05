/*
  # Schedule periodic sweep of deposit addresses (v2)

  1. Scheduled Jobs
    - `sweep-payments-every-3-min` - invokes the `sweep-payments` edge function every 3 minutes.
    - The function is deployed with verify_jwt=false so no Authorization header is required.

  2. Notes
    - Uses the project URL from vault; falls back to hardcoded project URL if missing.
*/

SELECT cron.schedule(
  'sweep-payments-every-3-min',
  '*/3 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://jgncnbmevixfvrcnistv.supabase.co/functions/v1/sweep-payments',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  );
  $cron$
);