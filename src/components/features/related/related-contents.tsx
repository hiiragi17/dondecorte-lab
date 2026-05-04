"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArticleCard } from "@/components/features/article/article-card";
import { LiveCard } from "@/components/features/live/live-card";
import { RadioCard } from "@/components/features/radio/radio-card";
import { TopicCard } from "@/components/features/topic/topic-card";
import { TvShowCard } from "@/components/features/tv-show/tv-show-card";
import { VideoCard } from "@/components/features/video/video-card";
import type { ArticleWithCasts } from "@/lib/types/article";
import type { LiveWithCasts } from "@/lib/types/live";
import type { RadioWithCasts } from "@/lib/types/radio";
import type { TopicWithCasts } from "@/lib/types/topic";
import type { TvShowWithCasts } from "@/lib/types/tv-show";
import type { VideoWithCasts } from "@/lib/types/video";

type TabKey = "videos" | "lives" | "radios" | "tv" | "articles" | "topics";

type Props = {
  videos: VideoWithCasts[];
  lives: LiveWithCasts[];
  radios: RadioWithCasts[];
  tvShows: TvShowWithCasts[];
  articles: ArticleWithCasts[];
  topics: TopicWithCasts[];
};

type TabConfig = {
  key: TabKey;
  label: string;
  count: number;
  listClassName: string;
  render: () => ReactNode;
};

export function RelatedContents({
  videos,
  lives,
  radios,
  tvShows,
  articles,
  topics,
}: Props) {
  const allTabs: TabConfig[] = [
    {
      key: "videos",
      label: "Videos",
      count: videos.length,
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
      listClassName: "space-y-3",
      render: () =>
        articles.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} />
          </li>
        )),
    },
    {
      key: "topics",
      label: "Topics",
      count: topics.length,
      listClassName: "space-y-3",
      render: () =>
        topics.map((t) => (
          <li key={t.id}>
            <TopicCard topic={t} />
          </li>
        )),
    },
  ];

  const tabs = allTabs.filter((t) => t.count > 0);
  const initialKey = tabs[0]?.key ?? "videos";
  const [active, setActive] = useState<TabKey>(initialKey);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (tabs.length === 0) return null;

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
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold text-brand-cream md:text-xl">
        関連コンテンツ
      </h2>
      <div
        role="tablist"
        aria-label="関連コンテンツ"
        className="mb-4 flex flex-wrap gap-1 overflow-x-auto border-b border-brand-border-dark"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab.key;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`related-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-controls={`related-tabpanel-${tab.key}`}
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
        id={`related-tabpanel-${activeTab.key}`}
        aria-labelledby={`related-tab-${activeTab.key}`}
      >
        <ul className={activeTab.listClassName}>{activeTab.render()}</ul>
      </div>
    </section>
  );
}
