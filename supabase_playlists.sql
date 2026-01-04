-- Create playlists table
create table if not exists playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  is_system boolean default false, -- true for "Watch Later"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create playlist_items table
create table if not exists playlist_items (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references playlists on delete cascade not null,
  video_id text not null, -- Can be UUID (local) or YouTube ID
  video_source text not null check (video_source in ('local', 'youtube')),
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb -- Cache title, thumbnail, channel info
);

-- RLS Policies for playlists
alter table playlists enable row level security;

create policy "Users can view their own playlists"
  on playlists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own playlists"
  on playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own playlists"
  on playlists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own playlists"
  on playlists for delete
  using (auth.uid() = user_id);

-- RLS Policies for playlist_items
alter table playlist_items enable row level security;

create policy "Users can view items in their playlists"
  on playlist_items for select
  using (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
      and playlists.user_id = auth.uid()
    )
  );

create policy "Users can add items to their playlists"
  on playlist_items for insert
  with check (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
      and playlists.user_id = auth.uid()
    )
  );

create policy "Users can remove items from their playlists"
  on playlist_items for delete
  using (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
      and playlists.user_id = auth.uid()
    )
  );
