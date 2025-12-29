-- Create Organizations Table
create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "subscription_plan" text not null default 'starter_999', -- 'starter_999', 'pro'
    "billing_cycle" text default 'monthly', -- 'monthly', 'yearly'
    "status" text default 'active',
    "max_users" integer default 10,
    "created_at" timestamp with time zone default now(),
    constraint "organizations_pkey" primary key ("id")
);

-- Create Membership Table (Links Profile -> Org)
create table "public"."organization_members" (
    "organization_id" uuid not null references "public"."organizations"("id") on delete cascade,
    "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
    "role" text not null default 'member', -- 'admin', 'member'
    "created_at" timestamp with time zone default now(),
    constraint "organization_members_pkey" primary key ("organization_id", "user_id")
);

-- Enable RLS
alter table "public"."organizations" enable row level security;
alter table "public"."organization_members" enable row level security;

-- Policies for Organizations
-- 1. Admins can view/update their own organization
DROP POLICY IF EXISTS "Admins can view their own org" ON "public"."organizations";
create policy "Admins can view their own org"
on "public"."organizations"
for select
using (
    exists (
        select 1 from "public"."organization_members" om
        where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can update their own org" ON "public"."organizations";
create policy "Admins can update their own org"
on "public"."organizations"
for update
using (
    exists (
        select 1 from "public"."organization_members" om
        where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
);

-- Policies for Members
-- 1. Users can view members of their own org
DROP POLICY IF EXISTS "Users can view members of their org" ON "public"."organization_members";
create policy "Users can view members of their org"
on "public"."organization_members"
for select
using (
    exists (
        select 1 from "public"."organization_members" om
        where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
    )
);

-- 2. Only Admins can insert/update/delete members
DROP POLICY IF EXISTS "Admins can manage members" ON "public"."organization_members";
create policy "Admins can manage members"
on "public"."organization_members"
for all
using (
    exists (
        select 1 from "public"."organization_members" om
        where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
);

-- Helper Function to create an org for a new user (Trigger or manual call)
-- For now, we'll handle this in the application logic or a future trigger
