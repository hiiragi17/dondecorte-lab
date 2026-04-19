import type { CastEntry } from "@/lib/types";

export type Live = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  description: string | null;
  url: string | null;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
};

export type LiveInput = {
  title: string;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  description: string | null;
  url: string | null;
  is_notified: boolean;
};

export type LiveWithCasts = Live & {
  casts: CastEntry[];
};

export type LiveFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof LiveInput | "casts", string>>;
};
