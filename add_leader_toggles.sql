-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/yjvrluwawbrnecaeoiax/sql

ALTER TABLE email_notification_settings
ADD COLUMN IF NOT EXISTS leader_daily_radar_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS leader_weekly_report_enabled BOOLEAN DEFAULT true;
