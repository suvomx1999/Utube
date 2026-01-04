-- Add parent_id to comments table for nesting
alter table comments 
add column if not exists parent_id uuid references comments(id) on delete cascade;

-- Policy to allow anyone to view replies
-- (Already covered by existing select policy if it's broad, but ensuring it here)
-- existing policy: "Everyone can view comments"

-- Policy to allow authenticated users to insert replies
-- existing policy: "Authenticated users can insert comments" checks auth.uid() = user_id. 
-- That should be fine as long as we pass the correct user_id.

-- Create an index on parent_id for faster lookups
create index if not exists comments_parent_id_idx on comments(parent_id);
