import type { CastEntry } from "@/lib/types";

export type VideoSource = "manual" | "youtube_auto";

export type VideoReviewStatus = "pending" | "approved" | "rejected";

export type Video = {
  id: string;
  title: string;
  youtube_url: string | null;
  youtube_video_id: string | null;
  youtube_channel_id: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  description: string | null;
  source: VideoSource;
  review_status: VideoReviewStatus;
  created_at: string;
  updated_at: string;
};

export type VideoInput = {
  title: string;
  youtube_url: string | null;
  youtube_video_id: string | null;
  youtube_channel_id: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  description: string | null;
};

export type VideoWithCasts = Video & {
  casts: CastEntry[];
};

export type VideoFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof VideoInput | "casts", string>>;
};
