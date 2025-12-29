-- Add configuration columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS email_sender_name text,
ADD COLUMN IF NOT EXISTS email_reply_to text,
ADD COLUMN IF NOT EXISTS weekly_report_time text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS daily_digest_time text DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS weekly_report_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_digest_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS realtime_alerts_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
