import type { Metadata } from "next";
import Link from "next/link";
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
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
            ライブ
          </h1>
          <p className="mt-2 text-sm text-brand-gold md:text-base">
            ドンデコルテさん関連のライブ情報一覧。
          </p>
        </div>
        <Link
          href="/calendar"
          className="rounded-md border border-brand-border-dark bg-brand-card-dark px-3 py-1.5 text-sm text-brand-sky-light transition hover:border-brand-sky hover:text-brand-sky"
        >
          カレンダーで見る
        </Link>
      </header>

      <ListFilterBar performers={performers} />

      <LiveList lives={lives} />
    </div>
  );
}
