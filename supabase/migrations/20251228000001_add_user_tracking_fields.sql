-- Add tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_method text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Comment on columns for clarity
COMMENT ON COLUMN public.profiles.signup_method IS 'Method used for signup/login: email_password, magic_link, phone, google, etc.';
COMMENT ON COLUMN public.profiles.last_login IS 'Timestamp of the last successful login';
