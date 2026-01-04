-- Create a table to track unique video views
CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own view
CREATE POLICY "User Insert View" 
ON video_views FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own views (to check if they already viewed)
CREATE POLICY "User Select View" 
ON video_views FOR SELECT 
USING (auth.uid() = user_id);

-- Allow public to view (optional, but good for debugging if needed, or strict it to owners)
-- Actually, we only need to check if *we* viewed it.
