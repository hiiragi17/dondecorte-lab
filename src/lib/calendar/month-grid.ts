export type CalendarDay = {
  /** YYYY-MM-DD */
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function todayInTokyo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseYearMonth(
  value: string | undefined,
  fallbackYear: number,
  fallbackMonth: number
): { year: number; month: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return { year: fallbackYear, month: fallbackMonth };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { year: fallbackYear, month: fallbackMonth };
  return { year, month };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const dt = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1 };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

// 日曜始まりの 6 週 × 7 日（42 セル）固定マトリクス。
export function buildMonthMatrix(
  year: number,
  month: number,
  today: string
): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
  const cursor = new Date(first);
  cursor.setUTCDate(1 - startWeekday);

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth() + 1;
      const dd = cursor.getUTCDate();
      const date = ymd(y, m, dd);
      week.push({
        date,
        day: dd,
        inCurrentMonth: m === month && y === year,
        isToday: date === today,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
