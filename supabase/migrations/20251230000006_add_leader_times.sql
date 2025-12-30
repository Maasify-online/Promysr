ALTER TABLE email_notification_settings
ADD COLUMN IF NOT EXISTS leader_daily_radar_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS leader_weekly_report_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS leader_report_timezone TEXT DEFAULT 'Asia/Kolkata';

-- Comment: These allow leaders to schedule their team reports independently of their personal daily briefs.
