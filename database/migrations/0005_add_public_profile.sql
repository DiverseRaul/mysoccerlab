-- Add is_public column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Update RLS policies to allow public profiles to be viewed by anyone
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles" ON user_profiles
  FOR SELECT USING (is_public = true);

-- Add index for performance on searching public profiles
CREATE INDEX idx_user_profiles_is_public ON user_profiles(is_public);
