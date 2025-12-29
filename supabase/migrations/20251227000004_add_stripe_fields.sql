-- Add Stripe fields to organizations table
ALTER TABLE "public"."organizations" 
ADD COLUMN IF NOT EXISTS "stripe_customer_id" text,
ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;

-- Create index for faster lookups by customer ID (used in webhooks)
CREATE INDEX IF NOT EXISTS "organizations_stripe_customer_id_idx" 
ON "public"."organizations" ("stripe_customer_id");
