import { YoutubePlayer } from '@/components/YoutubePlayer';

export default function TestPlayerPage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Test Player</h1>
      <YoutubePlayer videoId="actualVideoIdHere" />
    </div>
  );
}
