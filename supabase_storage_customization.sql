-- Create storage buckets for channel customization
-- Note: Supabase Storage buckets are usually created via the dashboard or API, 
-- but we can insert into storage.buckets if the extension is enabled and permissions allow.
-- Ideally, the user should create these in the dashboard: 'avatars', 'banners'.

-- We will try to create them via SQL if possible, otherwise user needs to do it manually.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Set up RLS policies for storage objects
-- Allow public read access
create policy "Public Access"
on storage.objects for select
using ( bucket_id in ('avatars', 'banners') );

-- Allow authenticated users to upload their own files
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id in ('avatars', 'banners') 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own files
create policy "Users can update their own files"
on storage.objects for update
using (
  bucket_id in ('avatars', 'banners') 
  and auth.uid() = owner
);

-- Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id in ('avatars', 'banners') 
  and auth.uid() = owner
);
