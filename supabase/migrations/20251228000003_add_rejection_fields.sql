-- Add rejection fields to promises table for Phase 2
-- This migration adds support for leaders to reject promise completions with feedback

-- Add rejection tracking fields
ALTER TABLE promises ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE promises ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;
ALTER TABLE promises ADD COLUMN IF NOT EXISTS last_rejected_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN promises.rejection_reason IS 'Reason provided by leader when rejecting completion';
COMMENT ON COLUMN promises.rejection_count IS 'Number of times this promise has been rejected';
COMMENT ON COLUMN promises.last_rejected_at IS 'Timestamp of most recent rejection';
