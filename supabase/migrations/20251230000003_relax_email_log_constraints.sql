-- 1. Relax constraints
ALTER TABLE public.emails_log DROP CONSTRAINT IF EXISTS emails_log_email_type_check;
ALTER TABLE public.emails_log DROP CONSTRAINT IF EXISTS emails_log_status_check;

-- 2. Update RLS to allow users to see ALL emails sent to them (Daily Briefs, etc.)
DROP POLICY IF EXISTS "Leaders can view their email logs" ON public.emails_log;

CREATE POLICY "Users can view their own received emails"
ON public.emails_log FOR SELECT
USING (
  recipient_email IN (
    SELECT email FROM public.profiles WHERE user_id = auth.uid()
  )
);
