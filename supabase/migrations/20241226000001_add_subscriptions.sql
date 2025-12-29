-- Add subscription tracking to profiles
alter table "public"."profiles" 
add column if not exists "subscription_status" text default 'none' check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'none')),
add column if not exists "trial_ends_at" timestamp with time zone,
add column if not exists "razorpay_subscription_id" text;

-- Add index for faster lookups
create index if not exists idx_profiles_subscription_status on "public"."profiles" ("subscription_status");
