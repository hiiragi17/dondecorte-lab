// Google カレンダーの「テンプレート URL」ビルダ。OAuth 不要でワンタップ追加できる。
// 注意: テンプレート URL ではリマインド時刻を指定できない（ユーザー既定の通知になる）。
// リマインド時刻を初期設定したい場合は個別 .ics（VALARM 付き）を使う。

const RENDER_BASE = "https://calendar.google.com/calendar/render";
const DEFAULT_TIMEZONE = "Asia/Tokyo";
const DEFAULT_DURATION_MINUTES = 120;

export type GoogleCalendarEvent = {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM or HH:MM:SS。null なら終日イベント。 */
  startTime: string | null;
  /** 時刻指定イベントの長さ。既定 120 分。終日イベントでは無視。 */
  durationMinutes?: number;
  /** 終日イベントの終了日（YYYY-MM-DD、含む）。複数日にまたがる帯に使う。 */
  endDate?: string | null;
  details?: string | null;
  location?: string | null;
  /** 既定 Asia/Tokyo。時刻指定イベントの ctz に使う。 */
  timezone?: string;
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseDate(dateStr: string): { y: number; m: number; d: number } {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`date は YYYY-MM-DD 形式で渡してください: ${dateStr}`);
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const isValid =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d;
  if (!isValid) {
    throw new Error(`存在しない日付です: ${dateStr}`);
  }
  return { y, m, d };
}

function parseTime(time: string): { hh: string; mm: string; ss: string } {
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error(
      `startTime は HH:MM もしくは HH:MM:SS 形式で渡してください: ${time}`
    );
  }
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  const ss = Number(match[3] ?? 0);
  if (hh > 23 || mm > 59 || ss > 59) {
    throw new Error(`startTime の値が範囲外です: ${time}`);
  }
  return { hh: pad2(hh), mm: pad2(mm), ss: pad2(ss) };
}

function compactDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function addDays(dateStr: string, days: number): string {
  const { y, m, d } = parseDate(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function buildTimedRange(
  date: string,
  startTime: string,
  durationMinutes: number
): string {
  const { y, m, d } = parseDate(date);
  const { hh, mm, ss } = parseTime(startTime);
  const start = new Date(
    Date.UTC(y, m - 1, d, Number(hh), Number(mm), Number(ss))
  );
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (dt: Date) =>
    `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth() + 1)}${pad2(dt.getUTCDate())}` +
    `T${pad2(dt.getUTCHours())}${pad2(dt.getUTCMinutes())}${pad2(dt.getUTCSeconds())}`;
  return `${fmt(start)}/${fmt(end)}`;
}

function buildAllDayRange(date: string, endDate?: string | null): string {
  // Google の終日イベントは終了日が「翌日（排他的）」。
  const lastDay = endDate ?? date;
  const exclusiveEnd = addDays(lastDay, 1);
  return `${compactDate(date)}/${compactDate(exclusiveEnd)}`;
}

export function buildGoogleCalendarUrl(event: GoogleCalendarEvent): string {
  const timezone = event.timezone ?? DEFAULT_TIMEZONE;
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", event.title);

  if (event.startTime) {
    const duration = event.durationMinutes ?? DEFAULT_DURATION_MINUTES;
    params.set("dates", buildTimedRange(event.date, event.startTime, duration));
    params.set("ctz", timezone);
  } else {
    params.set("dates", buildAllDayRange(event.date, event.endDate));
  }

  if (event.details) params.set("details", event.details);
  if (event.location) params.set("location", event.location);

  return `${RENDER_BASE}?${params.toString()}`;
}
