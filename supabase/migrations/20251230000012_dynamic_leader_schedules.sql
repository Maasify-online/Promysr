-- Migration: Add Dynamic Schedule Columns for Leader Notifications

-- 1. Add leader_daily_radar_days (Array of text, default Mon-Fri)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notification_settings' 
        AND column_name = 'leader_daily_radar_days'
    ) THEN
        ALTER TABLE email_notification_settings
        ADD COLUMN leader_daily_radar_days text[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday"}'::text[];
    END IF;
END $$;

-- 2. Add leader_weekly_report_day (Text, default Monday)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notification_settings' 
        AND column_name = 'leader_weekly_report_day'
    ) THEN
        ALTER TABLE email_notification_settings
        ADD COLUMN leader_weekly_report_day text DEFAULT 'monday';
    END IF;
END $$;

-- 3. Add leader_weekly_report_frequency (Text, default 'weekly')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notification_settings' 
        AND column_name = 'leader_weekly_report_frequency'
    ) THEN
        ALTER TABLE email_notification_settings
        ADD COLUMN leader_weekly_report_frequency text DEFAULT 'weekly';
    END IF;
END $$;

-- 4. Add leader_weekly_report_last_sent (Timestamp, for frequency tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notification_settings' 
        AND column_name = 'leader_weekly_report_last_sent'
    ) THEN
        ALTER TABLE email_notification_settings
        ADD COLUMN leader_weekly_report_last_sent timestamptz;
    END IF;
END $$;
