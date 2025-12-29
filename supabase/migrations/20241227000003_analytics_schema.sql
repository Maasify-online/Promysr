-- 1. Add Phone Number to Profiles
alter table public.profiles 
add column if not exists phone_number text;

-- 2. Create Email Logs Table for Consumption Tracking
create table if not exists public.email_logs (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id),
    user_id uuid references public.profiles(id), -- Who triggered it (optional)
    recipient_email text not null,
    email_type text not null, -- 'invite', 'digest', 'alert', 'weekly'
    subject text,
    status text default 'sent',
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for logs
alter table public.email_logs enable row level security;

-- Policies for Email Logs
-- Admins can view all logs (temporary simpler policy for now)
create policy "Admins can view email logs" on email_logs for select using ( auth.role() = 'authenticated' );

-- System/Functions can insert logs (or authenticated users triggering checks)
create policy "System can insert email logs" on email_logs for insert with check ( auth.role() = 'authenticated' );


-- 3. Update User Trigger to capture Phone Number
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, email, full_name, avatar_url, phone_number)
  values (
      new.id, 
      new.id, 
      new.email, 
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'phone_number'
  );
  return new;
end;
$$ language plpgsql security definer;
