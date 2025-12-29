-- --------------------------------------------------------------
-- 1️⃣  Install the required extensions (run only once)
-- --------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;   -- cron scheduler
CREATE EXTENSION IF NOT EXISTS pg_net;    -- HTTP client inside Postgres

-- --------------------------------------------------------------
-- 2️⃣  Helper function that calls the Edge Function
-- --------------------------------------------------------------
-- Replace <PROJECT_REF> with your Supabase project reference
-- (e.g. yjvrluwawbrnecaeoix)
-- If you want to protect the function, replace <YOUR_JWT> with a
-- service‑role JWT. If the function is public, you can delete the
-- Authorization header line entirely.
CREATE OR REPLACE FUNCTION public.invoke_send_scheduled_emails()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    endpoint text := 'https://yjvrluwawbrnecaeoiax.supabase.co/functions/v1/send-scheduled-emails';
    auth_header jsonb := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ'
    );
BEGIN
    PERFORM net.http_post(
        url := endpoint,
        method := 'POST',
        headers := auth_header,
        body := '{}'::jsonb   -- empty JSON payload
    );
END;
$$;

-- --------------------------------------------------------------
-- 3️⃣  Create / replace the cron job
-- --------------------------------------------------------------
-- Runs at minute 0 of every hour (UTC). Change the cron expression
-- if you need a different schedule.
SELECT cron.schedule(
    job_name := 'hourly_send_scheduled_emails',
    schedule  := '0 * * * *',
    command   := $$SELECT public.invoke_send_scheduled_emails();$$
);

-- --------------------------------------------------------------
-- 4️⃣  (Optional) Drop the job later if you ever need to remove it
-- --------------------------------------------------------------
-- SELECT cron.unschedule('hourly_send_scheduled_emails');

-- --------------------------------------------------------------
-- 5️⃣  Verify the job exists
-- --------------------------------------------------------------
-- SELECT * FROM cron.job;
