-- Enable RLS
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ( auth.uid() = user_id );

-- PROMISES POLICIES
-- 1. View
DROP POLICY IF EXISTS "Users can view relevant promises" ON promises;
CREATE POLICY "Users can view relevant promises" ON promises FOR SELECT
USING (
  leader_id = auth.uid() OR 
  owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  owner_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
);

-- 2. Insert
DROP POLICY IF EXISTS "Users can create promises" ON promises;
CREATE POLICY "Users can create promises" ON promises FOR INSERT 
WITH CHECK ( auth.role() = 'authenticated' );

-- 3. Update
DROP POLICY IF EXISTS "Users can update their promises" ON promises;
CREATE POLICY "Users can update their promises" ON promises FOR UPDATE
USING (
  leader_id = auth.uid() OR 
  owner_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
);

-- 4. Delete
DROP POLICY IF EXISTS "Leader can delete promises" ON promises;
CREATE POLICY "Leader can delete promises" ON promises FOR DELETE
USING ( leader_id = auth.uid() );
