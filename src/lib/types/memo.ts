import type { ContentType } from "@/lib/types";

export type Memo = {
  id: string;
  target_type: ContentType;
  target_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type MemoFormState = {
  error?: string;
  fieldError?: string;
};
