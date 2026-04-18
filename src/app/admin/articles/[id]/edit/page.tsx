import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/features/article/article-form";
import { updateArticle } from "@/lib/actions/articles";
import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import { getArticle } from "@/lib/queries/articles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, artists, combos, units] = await Promise.all([
    getArticle(id),
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  if (!article) {
    notFound();
  }

  const action = updateArticle.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="text-xs text-brand-brown-light transition hover:text-brand-sky"
        >
          ← 記事一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-brown-dark">
          {article.title} を編集
        </h1>
      </div>

      <div className="rounded-lg border border-brand-border-light bg-brand-card-light p-6">
        <ArticleForm
          action={action}
          artists={artists}
          combos={combos}
          units={units}
          initialValues={article}
          initialCasts={article.casts}
          submitLabel="更新する"
        />
      </div>
    </div>
  );
}
