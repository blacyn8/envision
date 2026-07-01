-- ─────────────────────────────────────────────────────────────────────────────
-- Flix-Aura Database Schema
-- Run this in your Supabase SQL editor to initialise all tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enable vector search (for AI recommendations)
create extension if not exists vector;

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────

create type region_type as enum (
  'hollywood', 'nollywood', 'kdrama', 'bollywood', 'anime', 'african'
);

create type genre_type as enum (
  'action', 'romance', 'thriller', 'comedy', 'horror',
  'sci-fi', 'drama', 'animation', 'documentary', 'fantasy'
);

create type quality_type as enum ('4K', 'HD', '720p', '480p', '360p', '3GP');

create type format_type as enum ('MKV', 'MP4', 'AVI', '3GP', 'WebM');

create type content_type as enum ('movie', 'series', 'anime');

create type subscription_tier as enum ('free', 'premium', 'pro');

-- ─── MOVIES ──────────────────────────────────────────────────────────────────

create table movies (
  id                uuid primary key default uuid_generate_v4(),
  tmdb_id           integer unique,                     -- null for African-only titles
  title             text not null,
  slug              text not null unique,               -- url-safe identifier
  region            region_type not null,
  content_type      content_type not null default 'movie',
  genres            genre_type[] not null default '{}',
  year              integer not null,
  runtime_minutes   integer,
  synopsis          text,
  poster_url        text,
  backdrop_url      text,
  language          varchar(5) not null default 'en',   -- ISO 639-1
  rating            numeric(3,1) check (rating >= 0 and rating <= 10),
  rating_count      integer not null default 0,
  is_series         boolean not null default false,
  season_count      integer,
  episode_count     integer,
  has_subtitle_en   boolean not null default false,
  has_subtitle_sw   boolean not null default false,     -- Swahili
  has_subtitle_yo   boolean not null default false,     -- Yoruba
  ai_tags           text[] not null default '{}',       -- LLM-generated tags
  embedding         vector(1536),                       -- for AI similarity search
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Indexes for common filter queries
create index idx_movies_region        on movies (region);
create index idx_movies_year          on movies (year desc);
create index idx_movies_rating        on movies (rating desc nulls last);
create index idx_movies_content_type  on movies (content_type);
create index idx_movies_slug          on movies (slug);
-- Full-text search index
create index idx_movies_fts           on movies using gin(to_tsvector('english', title || ' ' || coalesce(synopsis, '')));
-- Vector similarity index (for AI recommendations)
create index idx_movies_embedding     on movies using ivfflat (embedding vector_cosine_ops);

-- ─── DOWNLOAD LINKS ──────────────────────────────────────────────────────────

create table download_links (
  id            uuid primary key default uuid_generate_v4(),
  movie_id      uuid not null references movies(id) on delete cascade,
  url           text not null,
  quality       quality_type not null,
  format        format_type not null,
  source        text not null,                -- e.g. 'netnaija', 'o2tv', 'tmdb'
  verified      boolean not null default false,
  verified_at   timestamptz,
  file_size_mb  numeric(8,1),
  created_at    timestamptz not null default now()
);

create index idx_download_links_movie_id on download_links (movie_id);
create index idx_download_links_quality  on download_links (quality);

-- ─── YOUTUBE EMBEDS ──────────────────────────────────────────────────────────
-- Official trailers, and (once human-approved via the content pipeline)
-- full movies that rightsholders have themselves uploaded to YouTube.

create table youtube_embeds (
  id                   uuid primary key default uuid_generate_v4(),
  movie_id             uuid not null references movies(id) on delete cascade,
  youtube_video_id     text not null,
  is_official_trailer  boolean not null default true,
  is_full_content      boolean not null default false,
  language             text not null default 'en',
  title                text,
  created_at           timestamptz not null default now(),
  unique(movie_id, youtube_video_id)
);

create index idx_youtube_embeds_movie_id on youtube_embeds (movie_id);

alter table youtube_embeds enable row level security;
create policy "Youtube embeds are publicly readable"
  on youtube_embeds for select using (true);

-- ─── USERS (extends Supabase auth.users) ─────────────────────────────────────

create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  avatar_url              text,
  subscription_tier       subscription_tier not null default 'free',
  subscription_expires_at timestamptz,
  stripe_customer_id      text unique,
  created_at              timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── USER INTERACTIONS ────────────────────────────────────────────────────────

create table user_interactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  movie_id    uuid not null references movies(id) on delete cascade,
  in_watchlist  boolean not null default false,
  user_rating   numeric(3,1) check (user_rating >= 1 and user_rating <= 10),
  watched       boolean not null default false,
  watched_at    timestamptz,
  created_at    timestamptz not null default now(),
  -- one row per user+movie pair
  unique(user_id, movie_id)
);

create index idx_user_interactions_user_id  on user_interactions (user_id);
create index idx_user_interactions_movie_id on user_interactions (movie_id);
create index idx_user_interactions_watchlist on user_interactions (user_id) where in_watchlist = true;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

-- Movies: public read, no public write
alter table movies enable row level security;
create policy "Movies are publicly readable"
  on movies for select using (true);

-- Download links: public read
alter table download_links enable row level security;
create policy "Download links are publicly readable"
  on download_links for select using (true);

-- Profiles: users can only read/update their own profile
alter table public.profiles enable row level security;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- User interactions: users can only see/change their own
alter table user_interactions enable row level security;
create policy "Users can manage own interactions"
  on user_interactions for all using (auth.uid() = user_id);
