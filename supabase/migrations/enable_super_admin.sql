-- 1. Add role column to profiles if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text default 'user';
  end if;
end $$;

-- 2. Update Trigger Function to capture 'role' from metadata
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
    coalesce(new.raw_user_meta_data->>'role', 'user') -- Default to 'user' if not provided
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create Policy: Admins can view ALL profiles
drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles" on profiles
for select using (
  role = 'admin'
);

-- 4. Create Policy: Admins can view ALL promises
drop policy if exists "Admins can view all promises" on promises;
create policy "Admins can view all promises" on promises
for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 5. Create Policy: Admins can view ALL email logs (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'emails_log') then
    execute 'drop policy if exists "Admins can view all email logs" on emails_log';
    execute 'create policy "Admins can view all email logs" on emails_log for select using ( exists ( select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''admin'' ) )';
  end if;
end $$;

-- 5. Seed Super Admin User (admin@promysr.com / adminadmin)
-- Note: We can't easily insert into auth.users via SQL without knowing the exact hashing algo/salt Supabase uses internally for this instance, 
-- or using the `supabase_admin` extension functions if available.
-- INSTEAD: We will trust the user to sign up via the UI or we use the client-side signup once to "seed" it.
-- BUT, to make "admin/admin" work immediately, we need this user.
-- WORKAROUND: We will assume the user will 'Sign Up' once with specific credentials, OR we handle the 'Mapping' in the frontend 
-- and let the frontend 'Sign Up' if it fails to 'Login'.
