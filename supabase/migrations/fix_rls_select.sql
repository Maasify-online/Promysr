-- FIX RLS VISIBILITY
-- The previous policy tried to read from auth.users (restricted).
-- We will switch to reading from public.profiles.

drop policy if exists "Users can view relevant promises" on promises;

create policy "Users can view relevant promises" on promises for select
using (
  -- 1. I am the Leader (creator)
  leader_id = auth.uid() 
  OR 
  -- 2. I am the Owner (assigned to me)
  -- We check against the email stored in my Profile
  owner_email = (select email from public.profiles where id = auth.uid())
);

-- Force a cache refresh just in case
notify pgrst, 'reload config';
