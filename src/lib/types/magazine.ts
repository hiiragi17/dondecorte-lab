import type { CastEntry } from "@/lib/types";

export type Magazine = {
  id: string;
  title: string;
  magazine_name: string | null;
  issue: string | null;
  publisher: string | null;
  url: string | null;
  published_on: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type MagazineInput = {
  title: string;
  magazine_name: string | null;
  issue: string | null;
  publisher: string | null;
  url: string | null;
  published_on: string | null;
  description: string | null;
};

export type MagazineWithCasts = Magazine & {
  casts: CastEntry[];
};

export type MagazineFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof MagazineInput | "casts", string>>;
};
