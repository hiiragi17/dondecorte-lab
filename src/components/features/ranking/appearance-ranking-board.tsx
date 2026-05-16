"use client";

import { useRef, useState } from "react";
import { getContentTypeLabel } from "@/components/shared/content-type-badge";
import { PerformerTag } from "@/components/shared/performer-tags";
import type { AppearanceRankingEntry } from "@/lib/queries/rankings";
import type { ContentType } from "@/lib/types";

type TabKey = "total" | ContentType;

const CONTENT_TYPES: ContentType[] = [
  "video",
  "live",
  "radio",
  "article",
  "tv_show",
  "topic",
];

const TABS: TabKey[] = ["total", ...CONTENT_TYPES];

function tabLabel(tab: TabKey): string {
  return tab === "total" ? "総合" : getContentTypeLabel(tab);
}

function metricOf(entry: AppearanceRankingEntry, tab: TabKey): number {
  return tab === "total" ? entry.total : entry.counts[tab];
}

export function AppearanceRankingBoard({
  ranking,
}: {
  ranking: AppearanceRankingEntry[];
}) {
  const [active, setActive] = useState<TabKey>("total");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = TABS.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;

    e.preventDefault();
    setActive(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  const rows = ranking
    .filter((entry) => metricOf(entry, active) > 0)
    .sort(
      (a, b) =>
        metricOf(b, active) - metricOf(a, active) ||
        b.total - a.total ||
        a.performer.name.localeCompare(b.performer.name, "ja")
    );

  return (
    <section>
      <div
        role="tablist"
        aria-label="コンテンツ種別"
        className="mb-4 flex flex-nowrap gap-1 overflow-x-auto border-b border-brand-border-dark [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab, index) => {
          const isActive = tab === active;
          const count = ranking.filter(
            (entry) => metricOf(entry, tab) > 0
          ).length;
          return (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`ranking-tab-${tab}`}
              role="tab"
              type="button"
              aria-controls="ranking-tabpanel"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              onClick={() => setActive(tab)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition ${
                isActive
                  ? "border-brand-sky text-brand-sky-light"
                  : "border-transparent text-brand-muted hover:text-brand-cream"
              }`}
            >
              {tabLabel(tab)}
              <span className="ml-1 text-xs text-brand-muted">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="ranking-tabpanel"
        aria-labelledby={`ranking-tab-${active}`}
        tabIndex={0}
      >
        {rows.length === 0 ? (
          <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
            出演データがまだありません。
          </p>
        ) : (
          <ol className="divide-y divide-brand-border-dark overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark">
            {rows.map((entry, index) => (
              <li
                key={`${entry.performer.type}-${entry.performer.id}`}
                className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4"
              >
                <RankBadge rank={index + 1} />
                <div className="min-w-0 flex-1">
                  <PerformerTag performer={entry.performer} />
                  {active === "total" ? (
                    <Breakdown counts={entry.counts} />
                  ) : null}
                </div>
                <p className="shrink-0 text-right">
                  <span className="text-lg font-bold tabular-nums text-brand-cream sm:text-xl">
                    {metricOf(entry, active)}
                  </span>
                  <span className="ml-0.5 text-xs text-brand-muted">回</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-brand-gold text-brand-bg-dark"
      : rank === 2
        ? "bg-brand-muted text-brand-bg-dark"
        : rank === 3
          ? "bg-brand-brown-light text-brand-cream"
          : "bg-brand-bg-dark text-brand-muted";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${tone}`}
      aria-label={`${rank}位`}
    >
      {rank}
    </span>
  );
}

function Breakdown({ counts }: { counts: Record<ContentType, number> }) {
  const items = CONTENT_TYPES.filter((type) => counts[type] > 0);
  if (items.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
      {items.map((type) => (
        <li key={type} className="text-xs text-brand-muted">
          {getContentTypeLabel(type)}
          <span className="ml-1 font-semibold tabular-nums text-brand-gold">
            {counts[type]}
          </span>
        </li>
      ))}
    </ul>
  );
}
