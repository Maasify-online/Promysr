-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  company_name text,
  avatar_url text,
  subscription_status text default 'none' check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'none')),
  trial_ends_at timestamp with time zone,
  razorpay_subscription_id text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. HANDLE NEW USER SIGNUP (Trigger - Safe Replace)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, email, full_name, avatar_url)
  values (new.id, new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Drop first to ensure no conflicts, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. PROMISES TABLE
create table if not exists public.promises (
  id uuid default gen_random_uuid() primary key,
  leader_id uuid references public.profiles(id) not null,
  promise_text text not null,
  owner_email text not null,
  owner_name text, 
  due_date date not null,
  status text default 'Open' check (status in ('Open', 'Closed', 'Missed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ENABLE RLS
alter table profiles enable row level security;
alter table promises enable row level security;

-- 5. POLICIES (DROP IF EXISTS FIRST)

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check ( auth.uid() = user_id );


-- Promises
drop policy if exists "Users can view relevant promises" on promises;
create policy "Users can view relevant promises" on promises for select
using (
  leader_id = auth.uid() OR 
  owner_email = (select email from auth.users where id = auth.uid()) OR
  owner_email = (select email from profiles where user_id = auth.uid())
);

drop policy if exists "Users can create promises" on promises;
create policy "Users can create promises" on promises for insert 
with check ( auth.role() = 'authenticated' );

drop policy if exists "Users can update their promises" on promises;
create policy "Users can update their promises" on promises for update
using (
  leader_id = auth.uid() OR 
  owner_email = (select email from profiles where user_id = auth.uid())
);

-- 6. ORGANIZATIONS TABLE
create table if not exists "public"."organizations" (
    "id" uuid not null default gen_random_uuid() primary key,
    "name" text not null,
    "subscription_plan" text not null default 'starter_999',
    "billing_cycle" text default 'monthly',
    "status" text default 'active',
    "created_at" timestamp with time zone default now(),
    "owner_id" uuid references auth.users
);

-- 7. ORGANIZATION MEMBERS
create table if not exists "public"."organization_members" (
    "organization_id" uuid not null references "public"."organizations"("id") on delete cascade,
    "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
    "role" text not null default 'member',
    "created_at" timestamp with time zone default now(),
    primary key ("organization_id", "user_id")
);

-- 8. ORG POLICIES
alter table "organizations" enable row level security;
alter table "organization_members" enable row level security;

create policy "Admins can view their own org" on "organizations" for select using (
    exists (select 1 from "organization_members" om where om.organization_id = organizations.id and om.user_id = auth.uid())
);

create policy "Users can view members of their org" on "organization_members" for select using (
    exists (select 1 from "organization_members" om where om.organization_id = organization_members.organization_id and om.user_id = auth.uid())
);
