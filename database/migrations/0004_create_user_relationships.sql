-- Create user_relationships table
CREATE TABLE public.user_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can see who they are following and who is following them
CREATE POLICY "Users can view their own relationships" ON public.user_relationships
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can create follow relationships" ON public.user_relationships
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can delete their own follow relationships" ON public.user_relationships
  FOR DELETE USING (auth.uid() = follower_id);
