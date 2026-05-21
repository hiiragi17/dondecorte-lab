import type { ContentType } from "@/lib/types";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type TagInput = {
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
};

export type TagSummary = Pick<Tag, "id" | "name" | "slug" | "color">;

export type Tagging = {
  id: string;
  tag_id: string;
  target_type: ContentType;
  target_id: string;
  created_at: string;
};

export type TagWithCount = Tag & {
  taggings_count: number;
};
