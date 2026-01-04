-- Create video_views table if not exists
CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Policy for inserting own views
DROP POLICY IF EXISTS "Users can insert their own views" ON video_views;
CREATE POLICY "Users can insert their own views" 
ON video_views FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for viewing own views
DROP POLICY IF EXISTS "Users can view their own views" ON video_views;
CREATE POLICY "Users can view their own views" 
ON video_views FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure public access to videos table (for the join)
-- (We might have already created this, but good to ensure)
DROP POLICY IF EXISTS "Public Videos Access" ON videos;
CREATE POLICY "Public Videos Access" 
ON videos FOR SELECT 
USING (true);
