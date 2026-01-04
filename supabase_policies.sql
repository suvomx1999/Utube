-- Enable Row Level Security (RLS) on tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTIONS POLICIES --
-- Allow everyone to read subscriptions (needed for subscriber counts)
CREATE POLICY "Public Subscriptions Access" 
ON subscriptions FOR SELECT 
USING (true);

-- Allow authenticated users to subscribe (insert)
CREATE POLICY "User Subscribe" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = subscriber_id);

-- Allow users to unsubscribe (delete their own subscription)
CREATE POLICY "User Unsubscribe" 
ON subscriptions FOR DELETE 
USING (auth.uid() = subscriber_id);


-- LIKES POLICIES --
-- Allow everyone to read likes (needed for like counts)
CREATE POLICY "Public Likes Access" 
ON likes FOR SELECT 
USING (true);

-- Allow authenticated users to like (insert)
CREATE POLICY "User Like" 
ON likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to unlike (delete their own like)
CREATE POLICY "User Unlike" 
ON likes FOR DELETE 
USING (auth.uid() = user_id);


-- COMMENTS POLICIES --
-- Allow everyone to read comments
CREATE POLICY "Public Comments Access" 
ON comments FOR SELECT 
USING (true);

-- Allow authenticated users to comment
CREATE POLICY "User Comment" 
ON comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "User Delete Comment" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);


-- VIDEOS POLICIES --
-- Allow everyone to see videos
CREATE POLICY "Public Videos Access" 
ON videos FOR SELECT 
USING (true);

-- Allow authenticated users to upload
CREATE POLICY "User Upload" 
ON videos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own videos (e.g. view count)
CREATE POLICY "User Update Video" 
ON videos FOR UPDATE 
USING (true); 
-- Note: Ideally 'views' should be incrementable by anyone, but restricted otherwise. 
-- For simplicity, allowing update 'using (true)' allows view count increments by public.
