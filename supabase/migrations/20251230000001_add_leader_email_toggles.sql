-- Add separate toggles for leader-specific email notifications
-- This allows leaders to control whether they receive team-focused emails separately from their personal emails

ALTER TABLE email_notification_settings
ADD COLUMN IF NOT EXISTS leader_daily_radar_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS leader_weekly_report_enabled BOOLEAN DEFAULT true;

-- Add comments for clarity
COMMENT ON COLUMN email_notification_settings.daily_brief_enabled IS 'Enable/disable personal daily brief (user version)';
COMMENT ON COLUMN email_notification_settings.leader_daily_radar_enabled IS 'Enable/disable leader daily radar (team version)';
COMMENT ON COLUMN email_notification_settings.weekly_reminder_enabled IS 'Enable/disable personal weekly reminder (user version)';
COMMENT ON COLUMN email_notification_settings.leader_weekly_report_enabled IS 'Enable/disable leader weekly team report (team version)';
