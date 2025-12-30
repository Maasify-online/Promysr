
-- Update the cron job to run every 30 minutes instead of every hour
-- OLD: '0 * * * *' (Every hour)
-- NEW: '*/30 * * * *' (Every 30 minutes)

SELECT cron.unschedule('hourly_send_scheduled_emails');

SELECT cron.schedule(
    job_name := 'hourly_send_scheduled_emails',
    schedule  := '*/30 * * * *',
    command   := $$SELECT public.invoke_send_scheduled_emails();$$
);
