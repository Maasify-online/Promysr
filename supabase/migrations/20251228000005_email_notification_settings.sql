-- Create email notification settings table
-- Allows users to customize which emails they receive and when

CREATE TABLE IF NOT EXISTS email_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Email Type Settings (enable/disable)
    promise_created_enabled BOOLEAN DEFAULT true,
    review_needed_enabled BOOLEAN DEFAULT true,
    promise_closed_enabled BOOLEAN DEFAULT true,
    promise_missed_enabled BOOLEAN DEFAULT true,
    daily_brief_enabled BOOLEAN DEFAULT true,
    weekly_reminder_enabled BOOLEAN DEFAULT true,
    completion_rejected_enabled BOOLEAN DEFAULT true,
    promise_verified_enabled BOOLEAN DEFAULT true,
    
    -- Daily Brief Schedule
    daily_brief_time TIME DEFAULT '08:00:00',  -- UTC time
    daily_brief_timezone TEXT DEFAULT 'UTC',
    daily_brief_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
    
    -- Weekly Reminder Schedule
    weekly_reminder_day TEXT DEFAULT 'monday',
    weekly_reminder_time TIME DEFAULT '10:00:00',  -- Local time
    weekly_reminder_timezone TEXT DEFAULT 'Asia/Kolkata',
    weekly_reminder_frequency TEXT DEFAULT 'weekly', -- weekly, biweekly, monthly
    weekly_reminder_last_sent TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_notification_settings_updated_at
    BEFORE UPDATE ON email_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_email_notification_settings_updated_at();

-- RLS Policies
ALTER TABLE email_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON email_notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON email_notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON email_notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
    ON email_notification_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Create default settings for existing users
INSERT INTO email_notification_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM email_notification_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE email_notification_settings IS 'User preferences for email notifications including enable/disable toggles and custom schedules';
