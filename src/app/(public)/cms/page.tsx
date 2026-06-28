import type { Metadata } from "next";
import { CmCard } from "@/components/features/cm/cm-card";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listCmsWithCasts } from "@/lib/queries/cms";
import { listAllPerformers } from "@/lib/queries/performers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CM",
  description:
    "ドンデコルテさんが出演したCM・広告案件の一覧。",
  alternates: { canonical: "/cms" },
  openGraph: {
    title: "CM",
    description: "ドンデコルテさんが出演したCM・広告案件の一覧。",
    url: "/cms",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function CmsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [cms, performers] = await Promise.all([
    listCmsWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">CM</h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさんが出演したCM・広告案件。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      {cms.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだCMが登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {cms.map((cm) => (
            <li key={cm.id}>
              <CmCard cm={cm} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
