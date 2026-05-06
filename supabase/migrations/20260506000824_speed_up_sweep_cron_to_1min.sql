/*
  # Paspartinamas sweep-payments cron

  1. Pakeitimai
    - Esamas cron jobas keliamas iš kas 3 min į kas 1 min
    - Tai yra fallback apsauga — pagrindinis sweep vyksta iš karto per
      `verify-solana-payment` edge function, bet jei kažkas nepavyko,
      cron užbaigs darbą per maksimaliai 1 minutę.

  2. Saugumas
    - Jokių RLS ar lentelių pakeitimų
    - Cron jobas tik kviečia edge funkciją su tuščiu body
*/

DO $$
DECLARE
  sweep_job_id bigint;
BEGIN
  SELECT jobid INTO sweep_job_id
  FROM cron.job
  WHERE command ILIKE '%sweep-payments%'
  LIMIT 1;

  IF sweep_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(sweep_job_id);
  END IF;

  PERFORM cron.schedule(
    'sweep-payments-every-minute',
    '* * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://jgncnbmevixfvrcnistv.supabase.co/functions/v1/sweep-payments',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;
