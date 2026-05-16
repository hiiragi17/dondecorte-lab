import type { Metadata } from "next";
import { AppearanceRankingBoard } from "@/components/features/ranking/appearance-ranking-board";
import { listAppearanceRanking } from "@/lib/queries/rankings";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "ドンデコルテさん関連の出演者を、コンテンツ種別ごとの出演回数で集計したランキング。";

export const metadata: Metadata = {
  title: "出演回数ランキング",
  description: DESCRIPTION,
  alternates: { canonical: "/rankings" },
  openGraph: {
    title: "出演回数ランキング",
    description: DESCRIPTION,
    url: "/rankings",
  },
};

export default async function RankingsPage() {
  const ranking = await listAppearanceRanking();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          出演回数ランキング
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          コンテンツ種別ごとの出演回数を集計したランキング。
        </p>
      </header>

      <AppearanceRankingBoard ranking={ranking} />
    </div>
  );
}
