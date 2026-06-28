import type { Metadata } from "next";
import Link from "next/link";
import { ContentTypeBadge } from "@/components/shared/content-type-badge";
import { PerformerTagList } from "@/components/shared/performer-tags";
import { listTimeline, type TimelineItem } from "@/lib/queries/timeline";
import { formatDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "タイムライン",
  description:
    "ドンデコルテさん関連の全コンテンツ（動画・ライブ・ラジオ・記事・TV・トピック）を時系列で一覧できるタイムライン。",
  alternates: { canonical: "/timeline" },
  openGraph: {
    title: "タイムライン",
    description:
      "ドンデコルテさん関連の全コンテンツを時系列で一覧できるタイムライン。",
    url: "/timeline",
  },
};

const CONTENT_TYPE_PATH: Record<TimelineItem["type"], string> = {
  video: "videos",
  live: "lives",
  radio: "radios",
  article: "articles",
  tv_show: "tv",
  topic: "topics",
  cm: "cms",
  magazine: "magazines",
};

type Group = {
  key: string;
  label: string;
  items: TimelineItem[];
};

function groupByDate(items: TimelineItem[]): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const raw = item.date ?? item.createdAt;
    const key = raw.slice(0, 10);
    const label = formatDate(key) ?? "日付未定";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, label, items: [item] });
    }
  }
  return Array.from(groups.values());
}

export default async function TimelinePage() {
  const items = await listTimeline();
  const groups = groupByDate(items);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          タイムライン
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          動画・ライブ・ラジオ・記事・TV・トピックを時系列で一覧。
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだコンテンツが登録されていません。
        </p>
      ) : (
        <ol className="space-y-8">
          {groups.map((group) => (
            <li key={group.key}>
              <div className="mb-3 border-l-2 border-brand-sky pl-3">
                <p
                  className="text-sm font-semibold text-brand-cream"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {group.label}
                </p>
              </div>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={`/${CONTENT_TYPE_PATH[item.type]}/${item.id}`}
                      className="block rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-3 transition hover:border-brand-sky-light"
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <ContentTypeBadge type={item.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-cream">
                            {item.title}
                          </p>
                          {item.casts.length > 0 ? (
                            <div className="mt-2">
                              <PerformerTagList performers={item.casts} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
