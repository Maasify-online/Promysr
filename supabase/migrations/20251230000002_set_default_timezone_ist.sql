-- Update default timezone to Asia/Kolkata (IST) for all email notifications
-- This ensures Indian users get emails at the correct local time

-- Update the default for new users
ALTER TABLE email_notification_settings 
ALTER COLUMN daily_brief_timezone SET DEFAULT 'Asia/Kolkata';

-- Update existing users who have the old UTC default
UPDATE email_notification_settings 
SET daily_brief_timezone = 'Asia/Kolkata' 
WHERE daily_brief_timezone = 'UTC';

-- Add comment for clarity
COMMENT ON COLUMN email_notification_settings.daily_brief_timezone IS 'Timezone for daily brief delivery (default: Asia/Kolkata for IST)';
COMMENT ON COLUMN email_notification_settings.weekly_reminder_timezone IS 'Timezone for weekly reminder delivery (default: Asia/Kolkata for IST)';
