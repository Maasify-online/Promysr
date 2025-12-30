-- 1. Create Policy for Admins to view ALL logs
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.emails_log;
CREATE POLICY "Admins can view all email logs"
ON public.emails_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 2. Safely Assign Admin Role to info@maasify.online
-- DO $$
-- DECLARE
--   target_user_id uuid;
-- BEGIN
--   -- Find the user ID from auth.users (requires specific permissions, works in SQL Editor)
--   SELECT id INTO target_user_id FROM auth.users WHERE email = 'info@maasify.online';
--
--   -- If user exists, ensure they have the admin role
--   IF target_user_id IS NOT NULL THEN
--     INSERT INTO public.user_roles (user_id, role)
--     VALUES (target_user_id, 'admin')
--     ON CONFLICT (user_id) DO UPDATE SET role = 'admin'; -- Ensure role is admin
--   END IF;
-- END $$;
