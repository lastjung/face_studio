-- 1. Create Images Table (`public.images`)
create table if not exists public.images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  storage_path text not null, -- Path inside the bucket
  storage_url text null,      -- Public URL for frontend
  prompt text not null,
  model text default 'imagen-3.0',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on Images Table
alter table public.images enable row level security;

-- Policy: Everyone can view (Public Gallery)
create policy "Images are viewable by everyone"
  on public.images for select
  using ( true );

-- Policy: Only authenticated users can insert (their own)
create policy "Users can insert their own images"
  on public.images for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can delete their own images
create policy "Users can delete their own images"
  on public.images for delete
  using ( auth.uid() = user_id );


-- 3. Create Storage Bucket (`generated_images`)
-- This inserts directly into the `storage.buckets` table.
insert into storage.buckets (id, name, public)
values ('generated_images', 'generated_images', true)
on conflict (id) do nothing;


-- 4. Storage Policies (Bucket: `generated_images`)

-- Policy: Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'generated_images' );

-- Policy: Authenticated Upload Access
create policy "Authenticated Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'generated_images'
    and auth.role() = 'authenticated'
  );

-- Policy: Users can delete their own objects (Optional, good for cleanup)
create policy "Users can delete own objects"
  on storage.objects for delete
  using (
    bucket_id = 'generated_images'
    and auth.uid() = owner
  );
