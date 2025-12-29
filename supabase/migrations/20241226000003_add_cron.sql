-- Enable Extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the Morning Brief (Runs daily at 8:00 AM UTC)
-- NOTE: You must replace YOUR_SERVICE_ROLE_KEY with your actual Supabase Service Role Key.
-- You can find this in Project Settings > API.

select
  cron.schedule(
    'morning-brief',
    '0 8 * * *', -- 8:00 AM UTC (Adjust for your timezone if needed)
    $$
    select
      net.http_post(
          url:='https://yjvrluwawbrnecaeoiax.supabase.co/functions/v1/send-morning-brief',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- To verify it's scheduled:
-- select * from cron.job;

-- To test it manually immediately:
-- select net.http_post(... same as above ...);
