import type { Metadata } from "next";
import { TopicCard } from "@/components/features/topic/topic-card";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import {
  parsePerformerParam,
  parseSortParam,
} from "@/lib/queries/_list-options";
import { listAllPerformers } from "@/lib/queries/performers";
import { listTopicsWithCasts } from "@/lib/queries/topics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "トピック",
  description:
    "ドンデコルテさん関連のトピック一覧。写真撮影会、X投稿、CM情報などの雑多な情報をまとめています。",
  alternates: { canonical: "/topics" },
  openGraph: {
    title: "トピック",
    description: "ドンデコルテさん関連のトピック一覧。",
    url: "/topics",
  },
};

type SearchParams = Promise<{
  sort?: string | string[];
  performer?: string | string[];
}>;

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);
  const performer = parsePerformerParam(params.performer);

  const [topics, performers] = await Promise.all([
    listTopicsWithCasts({ sort, performer }),
    listAllPerformers(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          トピック
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          写真撮影会・X投稿・CM情報など、ドンデコルテさんに関する雑多な情報。
        </p>
      </header>

      <ListFilterBar performers={performers} />

      {topics.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだトピックが登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <TopicCard topic={topic} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
