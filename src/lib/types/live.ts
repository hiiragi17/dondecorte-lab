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

/** チケットスケジュールの種別。抽選期間 / 販売期間。 */
export type LiveSchedulePhase = "lottery" | "sale";

export const LIVE_SCHEDULE_PHASES: readonly LiveSchedulePhase[] = [
  "lottery",
  "sale",
];

export const LIVE_SCHEDULE_PHASE_LABEL: Record<LiveSchedulePhase, string> = {
  lottery: "抽選",
  sale: "販売",
};

export type LiveSchedule = {
  id: string;
  live_id: string;
  phase_type: LiveSchedulePhase;
  label: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  url: string | null;
  sort_order: number;
};

/** フォーム入力 → DB 保存用（id を持たない）。 */
export type LiveScheduleInput = {
  phase_type: LiveSchedulePhase;
  label: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  url: string | null;
  sort_order: number;
};

export type LiveWithCasts = Live & {
  casts: CastEntry[];
  schedules: LiveSchedule[];
};

export type LiveFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof LiveInput | "casts" | "schedules", string>>;
};
