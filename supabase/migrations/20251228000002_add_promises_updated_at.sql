-- Add missing updated_at column to promises table
-- This column is referenced by the update_promises_updated_at trigger

ALTER TABLE public.promises 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to have updated_at = created_at
UPDATE public.promises 
SET updated_at = created_at 
WHERE updated_at IS NULL;
