export type CastType = "artist" | "comedy_group" | "unit";

export type CastEntry = {
  type: CastType;
  id: string;
  name: string;
};

export const CONTENT_TYPES = [
  "video",
  "live",
  "radio",
  "article",
  "tv_show",
  "topic",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
