-- Add missing owner_id to organizations table
ALTER TABLE "public"."organizations" 
ADD COLUMN IF NOT EXISTS "owner_id" uuid REFERENCES auth.users(id);

-- Update RLS policy to include owner_id check if needed
-- (The existing policies check organization_members, so this might be for direct ownership tracking)
