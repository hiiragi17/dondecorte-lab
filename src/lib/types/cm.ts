import type { CastEntry } from "@/lib/types";

export type Cm = {
  id: string;
  title: string;
  advertiser: string | null;
  product: string | null;
  url: string | null;
  aired_on: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CmInput = {
  title: string;
  advertiser: string | null;
  product: string | null;
  url: string | null;
  aired_on: string | null;
  description: string | null;
};

export type CmWithCasts = Cm & {
  casts: CastEntry[];
};

export type CmFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CmInput | "casts", string>>;
};
