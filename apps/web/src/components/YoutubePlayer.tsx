interface YoutubePlayerProps {
  videoId: string;
}

export function YoutubePlayer({ videoId }: YoutubePlayerProps) {
  return (
    <div className="aspect-video w-full">
      <iframe
        className="h-full w-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
