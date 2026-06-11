-- External links (download/stream sources)
CREATE TABLE external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  quality TEXT,
  url TEXT NOT NULL,
  has_subtitles BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RSS sources (Anime/KDrama feeds)
CREATE TABLE rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scrape targets (Nollywood/African sites)
CREATE TABLE scrape_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scraper run logs
CREATE TABLE scraper_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  items_found INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- YouTube embeds (Phase B legal streaming)
CREATE TABLE youtube_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  is_full_content BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atomic click counter
CREATE OR REPLACE FUNCTION increment_click_count(link_id UUID)
RETURNS void AS $$
  UPDATE external_links SET click_count = click_count + 1 WHERE id = link_id;
$$ LANGUAGE sql;
