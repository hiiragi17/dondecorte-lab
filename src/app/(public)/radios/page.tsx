import type { Metadata } from "next";
import { RadioCard } from "@/components/features/radio/radio-card";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listAllPerformers } from "@/lib/queries/performers";
import { listRadiosWithCasts } from "@/lib/queries/radios";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ラジオ",
  description: "ドンデコルテさんのラジオ出演情報一覧。",
  alternates: { canonical: "/radios" },
  openGraph: {
    title: "ラジオ",
    description: "ドンデコルテさんのラジオ出演情報一覧。",
    url: "/radios",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function RadiosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [radios, performers] = await Promise.all([
    listRadiosWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          ラジオ
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさんのラジオ出演情報一覧。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      {radios.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだラジオが登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {radios.map((radio) => (
            <li key={radio.id}>
              <RadioCard radio={radio} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
