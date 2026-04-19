import type { CastEntry } from "@/lib/types";

export type Topic = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  source: string | null;
  topic_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TopicInput = {
  title: string;
  content: string | null;
  url: string | null;
  source: string | null;
  topic_date: string | null;
};

export type TopicWithCasts = Topic & {
  casts: CastEntry[];
};
