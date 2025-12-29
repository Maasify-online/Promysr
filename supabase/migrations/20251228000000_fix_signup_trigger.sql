-- Fix for Signup 500 Error
-- The previous migration assumed a new table structure for 'profiles' with a default ID and unique user_id.
-- However, if the table was created by initial_setup.sql, it requires an explicit ID and might not have a unique constraint on user_id.
-- This function handles both cases by explicitly providing the ID (matching the User ID) and using a safe conflict resolution.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id, -- Valid for Old Schema (Required PK) and New Schema (Overrides Default)
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING; -- 'id' is PK in both schemas, so this is safe.
  RETURN NEW;
END;
$$;
