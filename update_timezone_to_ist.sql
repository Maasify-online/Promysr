-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/yjvrluwawbrnecaeoiax/sql

-- Update default timezone to Asia/Kolkata (IST) for daily brief
ALTER TABLE email_notification_settings 
ALTER COLUMN daily_brief_timezone SET DEFAULT 'Asia/Kolkata';

-- Update existing users from UTC to IST
UPDATE email_notification_settings 
SET daily_brief_timezone = 'Asia/Kolkata' 
WHERE daily_brief_timezone = 'UTC';

-- Verify the change
SELECT 
    daily_brief_timezone,
    COUNT(*) as user_count
FROM email_notification_settings 
GROUP BY daily_brief_timezone;
