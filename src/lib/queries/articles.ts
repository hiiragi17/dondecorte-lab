import { createClient } from "@/lib/supabase/server";
import { fetchCastsByContent } from "@/lib/queries/_casts";
import {
  getIdsForPerformer,
  type ListOptions,
} from "@/lib/queries/_list-options";
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

export async function listArticles(
  options: ListOptions = {}
): Promise<Article[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "article",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`記事一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Article[];
}

export async function listArticlesWithCasts(
  options: ListOptions = {}
): Promise<ArticleWithCasts[]> {
  const supabase = await createClient();
  const ascending = options.sort === "oldest";

  let allowedIds: string[] | null = null;
  if (options.performer) {
    allowedIds = await getIdsForPerformer(
      supabase,
      "article",
      options.performer
    );
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending, nullsFirst: false })
    .order("created_at", { ascending });

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`記事一覧の取得に失敗しました: ${error.message}`);
  }

  const articles = (data ?? []).map((row) =>
    toArticleBase(row as Record<string, unknown>)
  );
  const castsByContent = await fetchCastsByContent(
    supabase,
    "article",
    articles.map((a) => a.id)
  );

  return articles.map((article) => ({
    ...article,
    casts: castsByContent.get(article.id) ?? [],
  }));
}

export async function getArticle(id: string): Promise<ArticleWithCasts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`記事情報の取得に失敗しました: ${error.message}`);
  }

  if (!data) return null;

  const castsByContent = await fetchCastsByContent(supabase, "article", [id]);
  return {
    ...toArticleBase(data as Record<string, unknown>),
    casts: castsByContent.get(id) ?? [],
  };
}
