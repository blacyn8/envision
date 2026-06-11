export interface RawContentItem {
  title: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  content_type: 'movie' | 'series';
  region: string;
  source?: string;
}

export function normalizeTitle(title: string): string {
  return title
    .replace(/\(\d{4}\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/HD|CAM|WEBRIP|BLURAY/gi, '')
    .trim();
}

export function normalizeItem(raw: RawContentItem): RawContentItem {
  return {
    ...raw,
    title: normalizeTitle(raw.title),
    overview: raw.overview?.trim() || '',
  };
}
