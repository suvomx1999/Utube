-- Enable RLS to be sure
alter table comments enable row level security;

-- Drop existing delete policy if it exists
drop policy if exists "Users can delete their own comments" on comments;
drop policy if exists "Users can delete their own comments or comments on their videos" on comments;

-- Create the comprehensive delete policy
create policy "Users can delete their own comments or comments on their videos"
on comments for delete
using (
  auth.uid()::text = user_id::text -- Cast to text to avoid UUID/Text mismatch
  or 
  auth.uid()::text in ( -- Cast to text to avoid UUID/Text mismatch
    select user_id::text from videos where id::text = comments.video_id::text
  )
);
