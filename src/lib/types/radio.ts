import type { CastEntry } from "@/lib/types";

export type Radio = {
  id: string;
  title: string;
  platform: string | null;
  url: string | null;
  published_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type RadioInput = {
  title: string;
  platform: string | null;
  url: string | null;
  published_at: string | null;
  description: string | null;
};

export type RadioWithCasts = Radio & {
  casts: CastEntry[];
};

export type RadioFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof RadioInput | "casts", string>>;
};
