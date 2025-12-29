-- EMERGENCY ACCESS FOR HARDCODED ADMIN
-- Problem: Hardcoded login bypasses Supabase Auth, so the user is "anon".
-- Solution: Allow "anon" (public) to SELECT data from profiles/promises.

-- 1. Allow Public to READ Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" 
on profiles for select 
using ( true );

-- 2. Allow Public to READ Promises (BE CAREFUL - This exposes data publically, but needed for this specific setup request)
drop policy if exists "Public promises are viewable by everyone" on promises;
create policy "Public promises are viewable by everyone" 
on promises for select 
using ( true );

-- 3. Allow Public to READ Email Logs
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'emails_log') then
    execute 'drop policy if exists "Public email logs" on emails_log';
    execute 'create policy "Public email logs" on emails_log for select using ( true )';
  end if;
end $$;
