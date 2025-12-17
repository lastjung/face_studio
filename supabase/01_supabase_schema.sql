-- 1. Create a custom Enum type for Roles
-- This allows you to see a dropdown in the Supabase Dashboard Table Editor.
create type public.app_role as enum ('Admin', 'User');

-- 2. Create the Profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  updated_at timestamp with time zone,
  username text,
  full_name text,
  avatar_url text,
  website text,
  
  -- Role column: Uses the Enum type created above.
  -- You can select 'Admin' or 'User'. Null is allowed if you don't set a default (or you can remove 'default').
  -- Here we default to 'User' for safety, but you can change specific users to 'Admin' in the dashboard.
  role public.app_role default 'User',

  primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- 3. Enable Row Level Security (RLS)
-- This is critical for security. It ensures users can't modify others' data arbitrarily.
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 4. Create a Trigger to auto-create a profile on Signup
-- This ensures that whenever a new user signs up via Auth, a row is added to 'profiles' automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'User' -- Default role for new signups
  );
  return new;
end;
$$;

-- Trigger execution
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
