import type { Metadata } from "next";
import { LiveList } from "@/components/features/live/live-list";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listLivesWithCasts } from "@/lib/queries/lives";
import { listAllPerformers } from "@/lib/queries/performers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ライブ",
  description: "ドンデコルテさん関連のライブ情報一覧。",
  alternates: { canonical: "/lives" },
  openGraph: {
    title: "ライブ",
    description: "ドンデコルテさん関連のライブ情報一覧。",
    url: "/lives",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function LivesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [lives, performers] = await Promise.all([
    listLivesWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          ライブ
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連のライブ情報一覧。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      <LiveList lives={lives} />
    </div>
  );
}
