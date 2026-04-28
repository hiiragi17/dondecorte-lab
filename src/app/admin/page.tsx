import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type DashboardCard = {
  label: string;
  table: string;
  href: string;
};

const CARDS: DashboardCard[] = [
  { label: "芸人", table: "artists", href: "/admin/artists" },
  { label: "コンビ", table: "comedy_groups", href: "/admin/combos" },
  { label: "ユニット", table: "units", href: "/admin/units" },
  { label: "受賞歴", table: "achievements", href: "/admin/achievements" },
  { label: "動画", table: "videos", href: "/admin/videos" },
  { label: "ライブ", table: "lives", href: "/admin/lives" },
  { label: "ラジオ", table: "radios", href: "/admin/radios" },
  { label: "記事", table: "articles", href: "/admin/articles" },
  { label: "テレビ", table: "tv_shows", href: "/admin/tv" },
  { label: "トピック", table: "topics", href: "/admin/topics" },
  { label: "タグ", table: "tags", href: "/admin/tags" },
];

async function fetchCounts() {
  const supabase = await createClient();
  const results = await Promise.allSettled(
    CARDS.map(async (card) => {
      const { count, error } = await supabase
        .from(card.table)
        .select("*", { count: "exact", head: true });
      return { table: card.table, count: error ? null : count };
    })
  );
  const map = new Map<string, number | null>();
  results.forEach((r, index) => {
    const table = CARDS[index].table;
    map.set(table, r.status === "fulfilled" ? r.value.count : null);
  });
  return map;
}

export default async function AdminDashboardPage() {
  const counts = await fetchCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-brown-dark">
          ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-brand-brown-light">
          各テーブルの登録件数サマリ
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => {
          const count = counts.get(card.table);
          return (
            <Link
              key={card.table}
              href={card.href}
              className="block rounded-lg border border-brand-border-light bg-brand-card-light px-4 py-4 transition hover:border-brand-sky hover:shadow-sm"
            >
              <div className="text-xs text-brand-brown-light">{card.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-brand-brown-dark">
                  {count ?? "—"}
                </span>
                <span className="text-xs text-brand-brown-light">件</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
