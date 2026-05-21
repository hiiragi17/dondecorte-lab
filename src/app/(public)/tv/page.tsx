import type { Metadata } from "next";
import { TvShowCard } from "@/components/features/tv-show/tv-show-card";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listAllPerformers } from "@/lib/queries/performers";
import { listTvShowsWithCasts } from "@/lib/queries/tv-shows";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TV",
  description: "ドンデコルテさんのテレビ出演情報一覧。",
  alternates: { canonical: "/tv" },
  openGraph: {
    title: "TV",
    description: "ドンデコルテさんのテレビ出演情報一覧。",
    url: "/tv",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function TvPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [tvShows, performers] = await Promise.all([
    listTvShowsWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">TV</h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさんのテレビ出演情報一覧。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      {tvShows.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだTV番組が登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {tvShows.map((tvShow) => (
            <li key={tvShow.id}>
              <TvShowCard tvShow={tvShow} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
