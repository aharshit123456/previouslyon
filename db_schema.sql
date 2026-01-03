-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Handled by Supabase Auth, but we need a public profile table)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- SHOWS TABLE (Cache)
create table public.shows (
  id integer primary key, -- TMDB ID
  name text not null,
  poster_path text,
  first_air_date date,
  last_updated_at timestamp with time zone default now()
);

alter table public.shows enable row level security;
create policy "Shows are viewable by everyone." on public.shows for select using (true);
create policy "Authenticated users can insert shows." on public.shows for insert with check (auth.role() = 'authenticated');

-- EPISODES TABLE (Cache)
create table public.episodes (
  id integer primary key, -- TMDB Episode ID
  show_id integer references public.shows(id) not null,
  season_number integer not null,
  episode_number integer not null,
  name text,
  air_date date,
  still_path text,
  runtime integer,
  last_updated_at timestamp with time zone default now()
);

alter table public.episodes enable row level security;
create policy "Episodes are viewable by everyone." on public.episodes for select using (true);
create policy "Authenticated users can insert episodes." on public.episodes for insert with check (auth.role() = 'authenticated');

-- USER EPISODE PROGRESS
create table public.user_episode_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  episode_id integer references public.episodes(id) not null,
  show_id integer references public.shows(id), -- Smart Schema addition
  season_number integer,
  episode_number integer,
  watched_at timestamp with time zone default now(),
  
  unique(user_id, episode_id) -- Simple tracking for now, rewatch viewing log would need a separate table or different primary key
);

alter table public.user_episode_progress enable row level security;
create policy "Users can view their own progress." on public.user_episode_progress for select using (auth.uid() = user_id);
create policy "Users can insert their own progress." on public.user_episode_progress for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress." on public.user_episode_progress for update using (auth.uid() = user_id);
create policy "Users can delete their own progress." on public.user_episode_progress for delete using (auth.uid() = user_id);

-- REVIEWS
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  entity_type text check (entity_type in ('show', 'season', 'episode')),
  entity_id integer not null, -- TMDB ID of the entity
  rating integer check (rating >= 1 and rating <= 10),
  body text,
  
  -- Smart Schema: Direct links for easier joins
  show_id integer references public.shows(id),
  season_number integer,
  episode_number integer,
  
  created_at timestamp with time zone default now()
);

alter table public.reviews enable row level security;
create policy "Reviews are viewable by everyone." on public.reviews for select using (true);
create policy "Users can insert their own reviews." on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can update their own reviews." on public.reviews for update using (auth.uid() = user_id);
create policy "Users can delete their own reviews." on public.reviews for delete using (auth.uid() = user_id);

-- INDEXES
create index idx_progress_user_episode on public.user_episode_progress(user_id, episode_id);
create index idx_reviews_entity on public.reviews(entity_type, entity_id);
create index idx_reviews_user on public.reviews(user_id);
