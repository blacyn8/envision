-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002 — Content Pipeline (Phase A: link aggregator, Phase B ready)
-- Run this in Supabase SQL Editor AFTER schema.sql (001) has been applied.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── EXTERNAL LINKS ──────────────────────────────────────────────────────────
-- Phase A core table. Sits alongside the `download_links` table from Stage 1
-- but distinguishes stream vs download and tracks link health.

create type link_type as enum ('stream', 'download');

create table external_links (
  id            uuid primary key default uuid_generate_v4(),
  movie_id      uuid not null references movies(id) on delete cascade,
  provider_name text not null,              -- e.g. 'netnaija', 'fzmovies', 'youtube'
  link_type     link_type not null default 'download',
  url           text not null,
  quality       quality_type,
  is_active     boolean not null default true,
  last_checked  timestamptz,
  click_count   integer not null default 0,  -- tracks popularity, useful for ranking & ads
  created_at    timestamptz not null default now(),
  unique(movie_id, url)
);

create index idx_external_links_movie_id  on external_links (movie_id);
create index idx_external_links_active    on external_links (is_active) where is_active = true;
create index idx_external_links_provider  on external_links (provider_name);

alter table external_links enable row level security;
create policy "External links are publicly readable"
  on external_links for select using (is_active = true);
create policy "Service role can manage external links"
  on external_links for all using (auth.role() = 'service_role');

-- ─── SCRAPER LOG ─────────────────────────────────────────────────────────────
-- Tracks every scraper/sync run for debugging and monitoring.

create table scraper_log (
  id            uuid primary key default uuid_generate_v4(),
  source_name   text not null,              -- e.g. 'tmdb_sync', 'netnaija_scraper'
  run_at        timestamptz not null default now(),
  finished_at   timestamptz,
  items_found   integer not null default 0,
  items_added   integer not null default 0,
  items_updated integer not null default 0,
  items_failed  integer not null default 0,
  duration_ms   integer,
  error_message text,
  status        text not null default 'running' check (status in ('running', 'success', 'partial', 'failed'))
);

create index idx_scraper_log_source on scraper_log (source_name, run_at desc);

alter table scraper_log enable row level security;
create policy "Service role can manage scraper log"
  on scraper_log for all using (auth.role() = 'service_role');

-- ─── YOUTUBE EMBEDS (Phase B readiness) ──────────────────────────────────────
-- Lets us attach trailers now and full episodes/films later
-- once licensing or public-domain content is sourced.

create table youtube_embeds (
  id                   uuid primary key default uuid_generate_v4(),
  movie_id             uuid not null references movies(id) on delete cascade,
  youtube_video_id     text not null,         -- the 11-char YouTube ID
  is_official_trailer  boolean not null default true,
  is_full_content      boolean not null default false,  -- true once Phase B full episodes/films are added
  language             varchar(5) not null default 'en',
  title                text,                  -- optional override label, e.g. "Episode 1"
  created_at           timestamptz not null default now(),
  unique(movie_id, youtube_video_id)
);

create index idx_youtube_embeds_movie_id on youtube_embeds (movie_id);

alter table youtube_embeds enable row level security;
create policy "YouTube embeds are publicly readable"
  on youtube_embeds for select using (true);
create policy "Service role can manage youtube embeds"
  on youtube_embeds for all using (auth.role() = 'service_role');

-- ─── RSS SOURCES ─────────────────────────────────────────────────────────────
-- Configurable list of RSS feeds for Anime/KDrama drops.
-- Lets us add/disable feeds without redeploying code.

create table rss_sources (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,         -- e.g. 'nyaa-anime', 'subsplease-anime'
  feed_url    text not null,
  region      region_type not null,
  is_active   boolean not null default true,
  last_run_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table rss_sources enable row level security;
create policy "Service role can manage rss sources"
  on rss_sources for all using (auth.role() = 'service_role');

-- Seed starter sources — public, legal RSS feeds
insert into rss_sources (name, feed_url, region) values
  ('nyaa-anime', 'https://nyaa.si/?page=rss&c=1_2&f=0', 'anime'),
  ('subsplease-anime', 'https://subsplease.org/rss/?r=1080', 'anime')
on conflict (name) do nothing;

-- ─── SCRAPE TARGETS ──────────────────────────────────────────────────────────
-- Configurable list of sites the scraper visits.
-- CSS selectors are filled in per-site as you confirm them.
-- is_active stays false until selectors are verified — prevents
-- the cron job from running against unconfigured sites.

create table scrape_targets (
  id              uuid primary key default uuid_generate_v4(),
  provider_name   text not null unique,
  base_url        text not null,
  region          region_type not null,
  list_selector   text,                     -- CSS selector for movie card links on listing page
  title_selector  text,                     -- CSS selector for title on detail page
  link_selector   text,                     -- CSS selector for download/stream links
  is_active       boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table scrape_targets enable row level security;
create policy "Service role can manage scrape targets"
  on scrape_targets for all using (auth.role() = 'service_role');

-- Seed placeholder targets — inactive until selectors verified
insert into scrape_targets (provider_name, base_url, region, is_active) values
  ('fzmovies', 'https://fzmovies.net', 'hollywood', false),
  ('netnaija', 'https://netnaija.com', 'nollywood', false)
on conflict (provider_name) do nothing;
