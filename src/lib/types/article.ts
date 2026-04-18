import type { CastEntry } from "@/lib/types";

export type Article = {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleInput = {
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  content: string | null;
};

export type ArticleWithCasts = Article & {
  casts: CastEntry[];
};
