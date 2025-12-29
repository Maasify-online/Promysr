-- 1. ADD ROLE COLUMN to public.profiles
-- Safe check to add column only if it missing
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text default 'user';
  end if;
end $$;

-- 2. UPDATE TRIGGER to capture role from metadata on new signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. ENABLE ADMIN ACCESS via RLS Policies

-- Policy: Admins can see ALL profiles
drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles" on profiles
for select using (
  role = 'admin'
);

-- Policy: Admins can see ALL promises
drop policy if exists "Admins can view all promises" on promises;
create policy "Admins can view all promises" on promises
for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy: Admins can see ALL email logs (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'emails_log') then
    execute 'drop policy if exists "Admins can view all email logs" on emails_log';
    execute 'create policy "Admins can view all email logs" on emails_log for select using ( exists ( select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''admin'' ) )';
  end if;
end $$;

-- 4. SYNC EXISTING ADMIN USER
-- If the admin user was already created but the profile has no role, verify and update it.
-- This part updates the profile role based on auth.users metadata
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users 
  where raw_user_meta_data->>'role' = 'admin'
);
