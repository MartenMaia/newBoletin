-- Fallback scheduler using pg_cron + pg_net
-- Requires extensions (already enabled): pg_cron, pg_net
-- Also requires your EDGE_CRON_SECRET set in Supabase secrets and used by the edge function.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Create a cron job at 07:00 America/Sao_Paulo (server uses its timezone; set explicitly)
-- NOTE: Replace <PROJECT_REF> and <EDGE_CRON_SECRET> before running.

select
  cron.schedule(
    'ima_ingest_daily',
    '0 7 * * *',
    $$
    select
      net.http_post(
        url := 'https://jxzxtxayinqescmtuilp.functions.supabase.co/ima-ingest',
        headers := jsonb_build_object(
          'Authorization', 'Bearer <EDGE_CRON_SECRET>',
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $$
  );
