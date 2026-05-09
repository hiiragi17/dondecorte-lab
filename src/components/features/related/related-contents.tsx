import { ArticleCard } from "@/components/features/article/article-card";
import { LiveCard } from "@/components/features/live/live-card";
import { RadioCard } from "@/components/features/radio/radio-card";
import { TopicCard } from "@/components/features/topic/topic-card";
import { TvShowCard } from "@/components/features/tv-show/tv-show-card";
import { VideoCard } from "@/components/features/video/video-card";
import type { RelatedContents as RelatedContentsType } from "@/lib/queries/related-contents";

type Props = {
  contents: RelatedContentsType;
};

export function RelatedContents({ contents }: Props) {
  const { videos, lives, radios, articles, tvShows, topics } = contents;
  const total =
    videos.length +
    lives.length +
    radios.length +
    articles.length +
    tvShows.length +
    topics.length;

  if (total === 0) return null;

  return (
    <section className="mt-10 space-y-8">
      <h2 className="text-lg font-semibold text-brand-cream md:text-xl">
        関連コンテンツ
      </h2>

      {videos.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            動画
          </h3>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {videos.map((v) => (
              <li key={v.id}>
                <VideoCard video={v} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lives.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            ライブ
          </h3>
          <ul className="space-y-3">
            {lives.map((l) => (
              <li key={l.id}>
                <LiveCard live={l} variant="past" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {radios.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            ラジオ
          </h3>
          <ul className="space-y-3">
            {radios.map((r) => (
              <li key={r.id}>
                <RadioCard radio={r} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tvShows.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            TV
          </h3>
          <ul className="space-y-3">
            {tvShows.map((t) => (
              <li key={t.id}>
                <TvShowCard tvShow={t} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {articles.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            記事
          </h3>
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.id}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {topics.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-gold">
            トピック
          </h3>
          <ul className="space-y-3">
            {topics.map((t) => (
              <li key={t.id}>
                <TopicCard topic={t} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
