import { createClient } from "@/lib/supabase/server";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import type { Article, ArticleWithCasts } from "@/lib/types/article";

function toArticleBase(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    url: (row.url as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    content: (row.content as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`記事一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Article[];
}

export async function listArticlesWithCasts(): Promise<ArticleWithCasts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      `*,
       article_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`記事一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const casts = mapCasts(record.article_casts as CastRow[] | null | undefined);
    return { ...toArticleBase(record), casts };
  });
}

export async function getArticle(id: string): Promise<ArticleWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      `*,
       article_casts(
         id,
         artist_id,
         comedy_group_id,
         unit_id,
         artist:artists(id, name),
         comedy_group:comedy_groups(id, name),
         unit:units(id, name)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`記事情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const record = data as Record<string, unknown>;
  const casts = mapCasts(record.article_casts as CastRow[] | null | undefined);
  return { ...toArticleBase(record), casts };
}
