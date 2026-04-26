"use client";

import { useRef, useState, type ReactNode } from "react";
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

type TabConfig = {
  key: TabKey;
  label: string;
  count: number;
  emptyLabel: string;
  listClassName: string;
  render: () => ReactNode;
};

export function ContentTabs({
  videos,
  lives,
  radios,
  tvShows,
  articles,
}: Props) {
  const tabs: TabConfig[] = [
    {
      key: "videos",
      label: "Videos",
      count: videos.length,
      emptyLabel: "出演動画はまだ登録されていません。",
      listClassName: "grid grid-cols-2 gap-4 md:grid-cols-3",
      render: () =>
        videos.map((v) => (
          <li key={v.id}>
            <VideoCard video={v} />
          </li>
        )),
    },
    {
      key: "lives",
      label: "Lives",
      count: lives.length,
      emptyLabel: "出演ライブはまだ登録されていません。",
      listClassName: "space-y-3",
      render: () =>
        lives.map((l) => (
          <li key={l.id}>
            <LiveCard live={l} variant="past" />
          </li>
        )),
    },
    {
      key: "radios",
      label: "Radio",
      count: radios.length,
      emptyLabel: "出演ラジオはまだ登録されていません。",
      listClassName: "space-y-3",
      render: () =>
        radios.map((r) => (
          <li key={r.id}>
            <RadioCard radio={r} />
          </li>
        )),
    },
    {
      key: "tv",
      label: "TV",
      count: tvShows.length,
      emptyLabel: "出演TV番組はまだ登録されていません。",
      listClassName: "space-y-3",
      render: () =>
        tvShows.map((t) => (
          <li key={t.id}>
            <TvShowCard tvShow={t} />
          </li>
        )),
    },
    {
      key: "articles",
      label: "Articles",
      count: articles.length,
      emptyLabel: "関連記事はまだ登録されていません。",
      listClassName: "space-y-3",
      render: () =>
        articles.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} />
          </li>
        )),
    },
  ];

  const initialTab = (tabs.find((t) => t.count > 0) ?? tabs[0]).key;
  const [active, setActive] = useState<TabKey>(initialTab);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const next = tabs[index];
    setActive(next.key);
    tabRefs.current[index]?.focus();
  };

  const onTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = tabs.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;

    e.preventDefault();
    focusTab(next);
  };

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <section>
      <div
        role="tablist"
        aria-label="出演コンテンツ"
        className="mb-4 flex flex-wrap gap-1 overflow-x-auto border-b border-brand-border-dark"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`tab-${tab.key}`}
              role="tab"
              type="button"
              aria-controls={`tabpanel-${tab.key}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              onClick={() => setActive(tab.key)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition ${
                isActive
                  ? "border-brand-sky text-brand-sky-light"
                  : "border-transparent text-brand-muted hover:text-brand-cream"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs text-brand-muted">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab.key}`}
        aria-labelledby={`tab-${activeTab.key}`}
      >
        {activeTab.count > 0 ? (
          <ul className={activeTab.listClassName}>{activeTab.render()}</ul>
        ) : (
          <EmptyState message={activeTab.emptyLabel} />
        )}
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
