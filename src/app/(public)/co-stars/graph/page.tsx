import type { Metadata } from "next";
import Link from "next/link";
import { RelationGraph } from "@/components/features/relation/relation-graph";
import { getCoAppearanceGraph } from "@/lib/queries/co-appearance-graph";

export const dynamic = "force-dynamic";

const TITLE = "相関図";
const DESCRIPTION =
  "ドンデコルテさんを中心に、共演したコンビ・芸人・ユニットのつながりを可視化したネットワーク相関図。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/co-stars/graph" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/co-stars/graph",
  },
};

export default async function RelationGraphPage() {
  const graph = await getCoAppearanceGraph();
  const hasGraph = graph.found && graph.nodes.length > 1;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          {TITLE}
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          {DESCRIPTION}
        </p>
        {graph.found ? (
          <p className="mt-1 text-xs text-brand-muted">
            集計対象: ドンデコルテさんの登録コンテンツ {graph.totalContentCount} 件
          </p>
        ) : null}
        <Link
          href="/co-stars"
          className="mt-3 inline-block text-sm text-brand-sky-light transition hover:underline"
        >
          ← 共演ランキングを見る
        </Link>
      </header>

      {!graph.found ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          ドンデコルテさんの情報がまだ登録されていません。
        </p>
      ) : !hasGraph ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          共演データがまだありません。
        </p>
      ) : (
        <RelationGraph graph={graph} />
      )}
    </div>
  );
}
