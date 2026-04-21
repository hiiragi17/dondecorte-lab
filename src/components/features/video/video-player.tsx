type VideoPlayerProps = {
  youtubeVideoId: string;
  title: string;
};

export function VideoPlayer({ youtubeVideoId, title }: VideoPlayerProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </div>
  );
}
