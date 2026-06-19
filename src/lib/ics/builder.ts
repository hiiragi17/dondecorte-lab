/** 開始時刻の何分前にリマインドするか。例: 1440 = 前日同時刻 / 120 = 2時間前。 */
export type IcsReminder = {
  minutesBefore: number;
};

export type IcsEvent = {
  uid: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM or HH:MM:SS. null なら終日イベント。 */
  startTime: string | null;
  /** 既定 120 分。終日イベントでは無視。 */
  durationMinutes?: number;
  summary: string;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  /** VALARM。各要素が 1 つの DISPLAY アラームになる。 */
  reminders?: IcsReminder[];
};

export type IcsCalendarOptions = {
  prodId: string;
  calendarName: string;
  /** Asia/Tokyo など。VEVENT の TZID と X-WR-TIMEZONE に使う。 */
  timezone?: string;
  /** DTSTAMP に使う。テスト時に固定したい場合に渡す。 */
  now?: Date;
};

const CRLF = "\r\n";
const DEFAULT_TIMEZONE = "Asia/Tokyo";
const DEFAULT_DURATION_MINUTES = 120;

// Asia/Tokyo は通年 +09:00 で DST なし。strict parser 向けに VTIMEZONE を同梱する。
const VTIMEZONE_ASIA_TOKYO: readonly string[] = [
  "BEGIN:VTIMEZONE",
  "TZID:Asia/Tokyo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0900",
  "TZOFFSETTO:+0900",
  "TZNAME:JST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function foldIcsLine(line: string): string {
  const max = 75;
  if (Buffer.byteLength(line, "utf8") <= max) return line;
  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (currentBytes + charBytes > max) {
      out.push(current);
      current = char;
      currentBytes = charBytes;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  if (current) out.push(current);
  return out.join(`${CRLF} `);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}` +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    "T" +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    "Z"
  );
}

function formatLocalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return (
    `${dt.getUTCFullYear()}-` +
    pad2(dt.getUTCMonth() + 1) +
    "-" +
    pad2(dt.getUTCDate())
  );
}

function normalizeTime(time: string): { hh: string; mm: string; ss: string } {
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error(
      `IcsEvent.startTime は HH:MM もしくは HH:MM:SS 形式で渡してください: ${time}`
    );
  }
  return {
    hh: pad2(Number(match[1])),
    mm: pad2(Number(match[2])),
    ss: pad2(Number(match[3] ?? 0)),
  };
}

function addMinutesToLocal(
  dateStr: string,
  time: string,
  minutes: number
): { date: string; time: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const { hh, mm, ss } = normalizeTime(time);
  const dt = new Date(
    Date.UTC(y, m - 1, d, Number(hh), Number(mm), Number(ss))
  );
  dt.setUTCMinutes(dt.getUTCMinutes() + minutes);
  return {
    date:
      `${dt.getUTCFullYear()}-` +
      pad2(dt.getUTCMonth() + 1) +
      "-" +
      pad2(dt.getUTCDate()),
    time:
      pad2(dt.getUTCHours()) +
      ":" +
      pad2(dt.getUTCMinutes()) +
      ":" +
      pad2(dt.getUTCSeconds()),
  };
}

// VALARM の TRIGGER は開始時刻からの相対時間。分→日/時/分の順で見やすく丸める。
export function formatReminderTrigger(minutesBefore: number): string {
  if (!Number.isFinite(minutesBefore)) {
    throw new Error(
      `IcsReminder.minutesBefore は有限の数値で渡してください: ${minutesBefore}`
    );
  }
  const minutes = Math.max(0, Math.round(minutesBefore));
  if (minutes === 0) return "-PT0M";
  if (minutes % 1440 === 0) return `-P${minutes / 1440}D`;
  if (minutes % 60 === 0) return `-PT${minutes / 60}H`;
  return `-PT${minutes}M`;
}

function buildAlarm(reminder: IcsReminder, summary: string): string[] {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(summary)}`,
    `TRIGGER:${formatReminderTrigger(reminder.minutesBefore)}`,
    "END:VALARM",
  ];
}

function buildEvent(
  event: IcsEvent,
  options: { timezone: string; dtstamp: string }
): string[] {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${options.dtstamp}`);

  if (event.startTime) {
    const { hh, mm, ss } = normalizeTime(event.startTime);
    const dtstartLocal = `${formatLocalDate(event.date)}T${hh}${mm}${ss}`;
    lines.push(`DTSTART;TZID=${options.timezone}:${dtstartLocal}`);
    const duration = event.durationMinutes ?? DEFAULT_DURATION_MINUTES;
    const end = addMinutesToLocal(event.date, event.startTime, duration);
    const endTime = normalizeTime(end.time);
    const dtendLocal =
      `${formatLocalDate(end.date)}T` +
      `${endTime.hh}${endTime.mm}${endTime.ss}`;
    lines.push(`DTEND;TZID=${options.timezone}:${dtendLocal}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${formatLocalDate(event.date)}`);
    lines.push(
      `DTEND;VALUE=DATE:${formatLocalDate(addDays(event.date, 1))}`
    );
  }

  lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  for (const reminder of event.reminders ?? []) {
    lines.push(...buildAlarm(reminder, event.summary));
  }
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcsCalendar(
  events: IcsEvent[],
  options: IcsCalendarOptions
): string {
  const timezone = options.timezone ?? DEFAULT_TIMEZONE;
  const dtstamp = formatUtc(options.now ?? new Date());

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`PRODID:${options.prodId}`);
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escapeIcsText(options.calendarName)}`);
  lines.push(`X-WR-TIMEZONE:${timezone}`);

  if (timezone === "Asia/Tokyo") {
    lines.push(...VTIMEZONE_ASIA_TOKYO);
  }

  for (const event of events) {
    lines.push(...buildEvent(event, { timezone, dtstamp }));
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
