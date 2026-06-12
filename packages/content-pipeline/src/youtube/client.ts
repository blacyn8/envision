import axios from 'axios';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

export async function searchVideos(query: string, maxResults = 10) {
  const res = await axios.get(`${YT_BASE}/search`, {
    params: {
      key: API_KEY,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults,
      videoDuration: 'long', // filters out shorts/clips, favors full films
    },
  });

  return res.data.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.high.url,
  }));
}
