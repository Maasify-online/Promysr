-- Clear All User Data Script
-- This script removes all users and associated data from the database
-- WARNING: This action is irreversible!

-- 1. Delete all promise responses
DELETE FROM public.promise_responses;

-- 2. Delete all promises
DELETE FROM public.promises;

-- 3. Delete all feedback
DELETE FROM public.feedback;

-- 4. Delete all email logs
DELETE FROM public.emails_log;
DELETE FROM public.email_logs;

-- 5. Delete all waitlist entries
DELETE FROM public.waitlist;

-- 6. Delete all organization members
DELETE FROM public.organization_members;

-- 7. Delete all organizations
DELETE FROM public.organizations;

-- 8. Delete all user roles
DELETE FROM public.user_roles;

-- 9. Delete all profiles
DELETE FROM public.profiles;

-- 10. Delete all auth users (this will cascade to profiles due to foreign key)
DELETE FROM auth.users;

-- Confirmation message
SELECT 'All user data has been successfully cleared!' as status;
