import type { Metadata } from "next";
import { MagazineCard } from "@/components/features/magazine/magazine-card";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listMagazinesWithCasts } from "@/lib/queries/magazines";
import { listAllPerformers } from "@/lib/queries/performers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "雑誌",
  description: "ドンデコルテさんが掲載された雑誌の一覧。",
  alternates: { canonical: "/magazines" },
  openGraph: {
    title: "雑誌",
    description: "ドンデコルテさんが掲載された雑誌の一覧。",
    url: "/magazines",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function MagazinesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [magazines, performers] = await Promise.all([
    listMagazinesWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">雑誌</h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさんが掲載された雑誌。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      {magazines.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだ雑誌が登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {magazines.map((magazine) => (
            <li key={magazine.id}>
              <MagazineCard magazine={magazine} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
