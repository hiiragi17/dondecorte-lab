import type { CastType } from "@/lib/types";

export type AchievementTargetType = CastType;

export type Achievement = {
  id: string;
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  title: string;
  result: string;
  year: number;
  sort_order: number;
  created_at: string;
};

export type AchievementInput = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  title: string;
  result: string;
  year: number;
  sort_order: number;
};

export type AchievementWithTarget = Achievement & {
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};
