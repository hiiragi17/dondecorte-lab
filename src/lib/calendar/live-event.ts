import type { IcsReminder } from "@/lib/ics/builder";

// ライブ開始のリマインダ（VALARM）。前日同時刻 + 当日 2 時間前。
export const TIMED_LIVE_REMINDERS: IcsReminder[] = [
  { minutesBefore: 1440 },
  { minutesBefore: 120 },
];

// 終日扱い（開始時刻未定）のライブは前日リマインダのみ。
export const ALL_DAY_LIVE_REMINDERS: IcsReminder[] = [{ minutesBefore: 1440 }];

export function buildLiveCalendarDescription(args: {
  description: string | null;
  casts: { name: string }[];
  detailUrl: string;
}): string {
  const parts: string[] = [];
  if (args.description) parts.push(args.description);
  if (args.casts.length > 0) {
    parts.push(`出演: ${args.casts.map((c) => c.name).join(", ")}`);
  }
  parts.push(args.detailUrl);
  return parts.join("\n");
}
