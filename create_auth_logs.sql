-- 1. Create LOGS table
create table if not exists public.auth_logs (
  id uuid default gen_random_uuid() primary key,
  email text,
  event_type text not null, -- 'login_success', 'login_failed', 'logout', 'password_reset'
  details text, -- JSON string or simple text for error messages
  ip_address text, -- captured if possible
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.auth_logs enable row level security;

-- 3. RLS Policies

-- Public can INSERT logs (needed for login failures where user is anon)
drop policy if exists "Public can insert logs" on auth_logs;
create policy "Public can insert logs" on auth_logs for insert with check (true);

-- Admins can VIEW logs
drop policy if exists "Admins can view auth logs" on auth_logs;
create policy "Admins can view auth logs" on auth_logs for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Public Read (for Hardcoded Admin access workaround)
create policy "Public Read Auth Logs" on auth_logs for select using (true);
