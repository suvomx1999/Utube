-- Completely disable RLS first to check if that's the blocker (temporarily)
-- alter table comments disable row level security;

-- Or, let's try a much simpler policy structure to debug.
-- Sometimes "in" subqueries with different types (uuid vs text) are very finicky in Supabase.

drop policy if exists "Users can delete their own comments or comments on their videos" on comments;
drop policy if exists "Users can delete their own comments" on comments;

create policy "Users can delete comments"
on comments for delete
using (
  -- Option 1: User is the comment author
  auth.uid()::text = user_id::text
  or 
  -- Option 2: User is the video owner
  exists (
    select 1 from videos 
    where videos.id::text = comments.video_id::text 
    and videos.user_id::text = auth.uid()::text
  )
);
