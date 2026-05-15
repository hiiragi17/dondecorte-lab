import type { Metadata } from "next";
import Link from "next/link";
import {
  getCoAppearanceRanking,
  type CoAppearanceBreakdown,
  type CoAppearanceEntry,
} from "@/lib/queries/co-appearances";
import type { CastType, ContentType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TITLE = "共演分析";
const DESCRIPTION =
  "ドンデコルテさんと最も共演が多いコンビ・芸人・ユニットのランキング。";

const TOP_LIMIT = 20;

const CONTENT_TYPE_SHORT_LABEL: Record<ContentType, string> = {
  video: "動画",
  live: "ライブ",
  radio: "ラジオ",
  article: "記事",
  tv_show: "TV",
  topic: "トピック",
};

const PERFORMER_PATH: Record<CastType, string> = {
  artist: "artists",
  comedy_group: "combos",
  unit: "units",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/co-stars" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/co-stars",
  },
};

export default async function CoStarsPage() {
  const ranking = await getCoAppearanceRanking();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          {TITLE}
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          {DESCRIPTION}
        </p>
        {ranking.found ? (
          <p className="mt-1 text-xs text-brand-muted">
            集計対象: ドンデコルテさんの登録コンテンツ {ranking.totalContentCount} 件
          </p>
        ) : null}
      </header>

      {!ranking.found ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          ドンデコルテさんの情報がまだ登録されていません。
        </p>
      ) : (
        <div className="space-y-8 md:space-y-10">
          <RankingSection
            title="コンビ"
            description="ドンデコルテさんと共演が多いコンビ・トリオ"
            entries={ranking.combos}
          />
          <RankingSection
            title="芸人"
            description="ピンで共演している芸人"
            entries={ranking.artists}
          />
          <RankingSection
            title="ユニット"
            description="共演しているユニット"
            entries={ranking.units}
          />
        </div>
      )}
    </div>
  );
}

function RankingSection({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: CoAppearanceEntry[];
}) {
  const items = entries.slice(0, TOP_LIMIT);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-cream md:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-brand-muted md:text-sm">
            {description}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          共演データがまだありません。
        </p>
      ) : (
        <ol className="overflow-hidden rounded-lg border border-brand-border-dark bg-brand-card-dark">
          {items.map((entry, index) => (
            <li
              key={`${entry.performer.type}-${entry.performer.id}`}
              className="border-b border-brand-border-dark last:border-b-0"
            >
              <RankingRow rank={index + 1} entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RankingRow({
  rank,
  entry,
}: {
  rank: number;
  entry: CoAppearanceEntry;
}) {
  const href = `/${PERFORMER_PATH[entry.performer.type]}/${entry.performer.id}`;
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-3 transition hover:bg-brand-bg-dark/40"
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-cream md:text-base">
          {entry.performer.name}
        </p>
        <BreakdownLine breakdown={entry.breakdown} />
      </div>
      <div
        className="shrink-0 text-right"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <div className="text-lg font-bold leading-none text-brand-sky-light md:text-xl">
          {entry.count}
        </div>
        <div className="mt-1 text-[11px] text-brand-muted">共演</div>
      </div>
    </Link>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <div
      className={
        isTop3
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sky-pale/15 text-sm font-bold text-brand-sky-light md:h-10 md:w-10 md:text-base"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-bg-dark text-sm font-semibold text-brand-gold md:h-10 md:w-10"
      }
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={`${rank}位`}
    >
      {rank}
    </div>
  );
}

function BreakdownLine({ breakdown }: { breakdown: CoAppearanceBreakdown }) {
  const parts = (Object.keys(CONTENT_TYPE_SHORT_LABEL) as ContentType[])
    .filter((type) => breakdown[type] > 0)
    .map((type) => `${CONTENT_TYPE_SHORT_LABEL[type]} ${breakdown[type]}`);

  if (parts.length === 0) return null;

  return (
    <p
      className="mt-1 truncate text-xs text-brand-muted"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {parts.join(" / ")}
    </p>
  );
}
