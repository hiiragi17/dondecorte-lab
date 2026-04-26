"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/features/article/article-card";
import { LiveCard } from "@/components/features/live/live-card";
import { RadioCard } from "@/components/features/radio/radio-card";
import { TvShowCard } from "@/components/features/tv-show/tv-show-card";
import { VideoCard } from "@/components/features/video/video-card";
import type { ArticleWithCasts } from "@/lib/types/article";
import type { LiveWithCasts } from "@/lib/types/live";
import type { RadioWithCasts } from "@/lib/types/radio";
import type { TvShowWithCasts } from "@/lib/types/tv-show";
import type { VideoWithCasts } from "@/lib/types/video";

type TabKey = "videos" | "lives" | "radios" | "tv" | "articles";

type Props = {
  videos: VideoWithCasts[];
  lives: LiveWithCasts[];
  radios: RadioWithCasts[];
  tvShows: TvShowWithCasts[];
  articles: ArticleWithCasts[];
};

const TAB_LABEL: Record<TabKey, string> = {
  videos: "Videos",
  lives: "Lives",
  radios: "Radio",
  tv: "TV",
  articles: "Articles",
};

const EMPTY_LABEL: Record<TabKey, string> = {
  videos: "出演動画はまだ登録されていません。",
  lives: "出演ライブはまだ登録されていません。",
  radios: "出演ラジオはまだ登録されていません。",
  tv: "出演TV番組はまだ登録されていません。",
  articles: "関連記事はまだ登録されていません。",
};

export function ContentTabs({
  videos,
  lives,
  radios,
  tvShows,
  articles,
}: Props) {
  const counts: Record<TabKey, number> = {
    videos: videos.length,
    lives: lives.length,
    radios: radios.length,
    tv: tvShows.length,
    articles: articles.length,
  };
  const orderedTabs: TabKey[] = ["videos", "lives", "radios", "tv", "articles"];
  const initialTab =
    orderedTabs.find((t) => counts[t] > 0) ?? ("videos" as TabKey);
  const [active, setActive] = useState<TabKey>(initialTab);

  return (
    <section>
      <div
        role="tablist"
        aria-label="出演コンテンツ"
        className="mb-4 flex flex-wrap gap-1 overflow-x-auto border-b border-brand-border-dark"
      >
        {orderedTabs.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              type="button"
              aria-controls={`tabpanel-${tab}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition ${
                isActive
                  ? "border-brand-sky text-brand-sky-light"
                  : "border-transparent text-brand-muted hover:text-brand-cream"
              }`}
            >
              {TAB_LABEL[tab]}
              <span className="ml-1 text-xs text-brand-muted">
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {active === "videos" ? (
          videos.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {videos.map((v) => (
                <li key={v.id}>
                  <VideoCard video={v} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={EMPTY_LABEL.videos} />
          )
        ) : null}

        {active === "lives" ? (
          lives.length > 0 ? (
            <ul className="space-y-3">
              {lives.map((l) => (
                <li key={l.id}>
                  <LiveCard live={l} variant="past" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={EMPTY_LABEL.lives} />
          )
        ) : null}

        {active === "radios" ? (
          radios.length > 0 ? (
            <ul className="space-y-3">
              {radios.map((r) => (
                <li key={r.id}>
                  <RadioCard radio={r} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={EMPTY_LABEL.radios} />
          )
        ) : null}

        {active === "tv" ? (
          tvShows.length > 0 ? (
            <ul className="space-y-3">
              {tvShows.map((t) => (
                <li key={t.id}>
                  <TvShowCard tvShow={t} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={EMPTY_LABEL.tv} />
          )
        ) : null}

        {active === "articles" ? (
          articles.length > 0 ? (
            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={EMPTY_LABEL.articles} />
          )
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
      {message}
    </p>
  );
}
