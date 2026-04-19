import type { CastEntry } from "@/lib/types";

export type TvShow = {
  id: string;
  title: string;
  network: string | null;
  air_date: string | null;
  air_time: string | null;
  description: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

export type TvShowInput = {
  title: string;
  network: string | null;
  air_date: string | null;
  air_time: string | null;
  description: string | null;
  url: string | null;
};

export type TvShowWithCasts = TvShow & {
  casts: CastEntry[];
};
