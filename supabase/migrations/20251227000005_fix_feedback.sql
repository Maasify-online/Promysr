
-- Create Feedback Table if it doesn't exist
create table if not exists public.feedback (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    milestone integer,
    rating integer,
    comment text,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Policy: Users can insert their own feedback
drop policy if exists "Users can insert own feedback" on public.feedback;
create policy "Users can insert own feedback"
on public.feedback
for insert
with check ( auth.uid() = user_id );

-- Policy: Admins (or everyone) can view feedback (optional, for debugging)
drop policy if exists "Users can view own feedback" on public.feedback;
create policy "Users can view own feedback"
on public.feedback
for select
using ( auth.uid() = user_id );
