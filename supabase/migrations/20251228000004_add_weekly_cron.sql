-- Add cron job for weekly reminder emails
-- Runs every Monday at 10:00 AM IST (4:30 AM UTC)

SELECT cron.schedule(
    'weekly-reminder',           -- Job name
    '30 4 * * 1',                -- Cron expression: 4:30 AM UTC on Mondays (10 AM IST)
    $$
    SELECT
      net.http_post(
          url:='https://yjvrluwawbrnecaeoiax.supabase.co/functions/v1/send-weekly-reminder',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);

-- Note: Replace YOUR_SERVICE_ROLE_KEY with actual Supabase Service Role Key before deploying
