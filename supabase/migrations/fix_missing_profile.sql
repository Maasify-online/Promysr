-- BACKFILL PROFILES
-- If you signed up before the database was ready, your Profile row is missing.
-- This script manually creates it for you.

insert into public.profiles (id, user_id, email, full_name, avatar_url)
select 
  id, 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Verify it worked
select * from public.profiles;
