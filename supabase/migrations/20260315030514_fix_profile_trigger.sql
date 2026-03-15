-- Fix: The handle_new_user trigger needs to bypass RLS on the profiles table.
-- SECURITY DEFINER runs as the function owner (postgres), but we also need
-- an explicit RLS bypass policy for the service role / trigger context.

-- 1. Allow the service_role (and trigger context) to insert into profiles
CREATE POLICY "Service role inserts profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- 2. Recreate the trigger function with explicit SET search_path for security
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant usage to make sure the function can insert
GRANT INSERT ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
