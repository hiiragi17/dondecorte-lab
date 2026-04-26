import type { Metadata } from "next";
import { ArticleCard } from "@/components/features/article/article-card";
import { listArticlesWithCasts } from "@/lib/queries/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "記事",
  description:
    "ドンデコルテさん関連の記事・インタビュー一覧。本文は転載していません。各記事の出典元へのリンクのみ掲載しています。",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "記事",
    description: "ドンデコルテさん関連の記事・インタビュー一覧。",
    url: "/articles",
  },
};

export default async function ArticlesPage() {
  const articles = await listArticlesWithCasts();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          記事
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          ドンデコルテさん関連の記事・インタビュー。本文は転載せず、出典元へのリンクのみ掲載しています。
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-lg border border-brand-border-dark bg-brand-card-dark px-4 py-6 text-sm text-brand-muted">
          まだ記事が登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
