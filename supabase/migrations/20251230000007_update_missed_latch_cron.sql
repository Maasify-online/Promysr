-- 1. Reschedule check-missed to 18:30 UTC (00:00 IST Midnight)
-- This function "latches" missed promises (sets status to Missed) but sends NO emails found.
SELECT cron.schedule(
    'check_missed_promises',
    '30 18 * * *', -- 18:30 UTC = 00:00 IST
    $$
    SELECT net.http_post(
        url:='https://project-ref.supabase.co/functions/v1/check-missed',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
    $$
);

-- 2. Remove any old 10:00 AM IST (04:30 UTC) jobs if they exist safely
-- SELECT cron.unschedule('send-missed-report-old');
-- Safe cleanup:
DO $$
BEGIN
    PERFORM cron.unschedule('send-missed-report-old');
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if job doesn't exist
END $$;
-- (Optional cleanup of other names if used during dev)
