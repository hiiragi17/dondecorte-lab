import type { ContentType } from "@/lib/types";
import type { LiveSchedulePhase } from "@/lib/types/live";

/**
 * カレンダー上のエントリ種別。
 * - ライブ由来: event（当日）/ lottery（抽選期間）/ sale（販売期間）
 * - その他コンテンツ: 各 content_type に対応
 */
export type CalendarCategory =
  | "event"
  | "lottery"
  | "sale"
  | "tv"
  | "radio"
  | "video"
  | "article"
  | "cm"
  | "magazine"
  | "topic";

export const CALENDAR_CATEGORIES: readonly CalendarCategory[] = [
  "event",
  "lottery",
  "sale",
  "tv",
  "radio",
  "video",
  "article",
  "cm",
  "magazine",
  "topic",
];

export const CALENDAR_CATEGORY_LABEL: Record<CalendarCategory, string> = {
  event: "イベント",
  lottery: "抽選期間",
  sale: "販売期間",
  tv: "TV",
  radio: "ラジオ",
  video: "動画",
  article: "記事",
  cm: "CM",
  magazine: "雑誌",
  topic: "トピック",
};

/**
 * カレンダーチップ / チェックボックスの配色。ダークモード（公開側）前提。
 * text + bg + border をまとめた Tailwind クラス文字列。
 */
export const CALENDAR_CATEGORY_CLASS: Record<CalendarCategory, string> = {
  event: "bg-brand-sky-pale/15 text-brand-sky-light border-brand-sky/40",
  lottery: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  sale: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  tv: "bg-purple-400/15 text-purple-300 border-purple-400/40",
  radio: "bg-pink-400/15 text-pink-300 border-pink-400/40",
  video: "bg-red-400/15 text-red-300 border-red-400/40",
  article: "bg-blue-400/15 text-blue-300 border-blue-400/40",
  cm: "bg-orange-400/15 text-orange-300 border-orange-400/40",
  magazine: "bg-teal-400/15 text-teal-300 border-teal-400/40",
  topic: "bg-brand-card-dark text-brand-gold border-brand-border-dark",
};

/** チケットスケジュールの種別をカレンダー種別へ写像する。 */
export const LIVE_PHASE_CATEGORY: Record<LiveSchedulePhase, CalendarCategory> = {
  lottery: "lottery",
  sale: "sale",
};

/** タイムラインの content_type をカレンダー種別へ写像する。live は当日=event。 */
export const CONTENT_TYPE_TO_CATEGORY: Record<ContentType, CalendarCategory> = {
  video: "video",
  live: "event",
  radio: "radio",
  article: "article",
  tv_show: "tv",
  topic: "topic",
  cm: "cm",
  magazine: "magazine",
};
