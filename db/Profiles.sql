-- Profiles Table

-- 1. Profiles Schema
-- Stores public user information. Linked to auth.users via id.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null check (char_length(username) >= 3),
  full_name text,
  avatar_url text, -- Store URL to storage bucket
  bio text check (char_length(bio) <= 500),
  website text,
  
  -- Counts
  followers_count integer default 0,
  following_count integer default 0,
  posts_count integer default 0,
  
  gender text check (gender in ('male', 'female', 'other')),
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. RLS Policies
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Indexes
-- Trigram index for fuzzy search on username and full_name (requires pg_trgm extension)
create extension if not exists pg_trgm;
create index if not exists profiles_username_trgm_idx on public.profiles using gist (username gist_trgm_ops);
create index if not exists profiles_fullname_trgm_idx on public.profiles using gist (full_name gist_trgm_ops);

-- 4. Automatic Updated_At Trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 5. Auto-Profile Creation from Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger on auth.users 
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
