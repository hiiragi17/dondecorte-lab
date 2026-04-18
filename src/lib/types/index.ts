export type CastType = "artist" | "comedy_group" | "unit";

export type CastEntry = {
  type: CastType;
  id: string;
  name: string;
};

export type ContentType =
  | "video"
  | "live"
  | "radio"
  | "article"
  | "tv_show"
  | "topic";
