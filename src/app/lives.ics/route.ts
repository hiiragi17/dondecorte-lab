import { buildIcsCalendar, type IcsEvent } from "@/lib/ics/builder";
import { listLivesForCalendar } from "@/lib/queries/lives";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const PRODID = "-//dondecorte-lab//Lives//JA";
const CALENDAR_NAME = "ドンデコルテ出演ライブ";

// lives.start_time は schema 上 timestamptz。フォーム入力経路によっては
// "HH:MM:SS" 形式の文字列が入っている場合もあるため両方を許容する。
export function normalizeStartTimeForIcs(value: string | null): string | null {
  if (!value) return null;
  const hhmm = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmm) {
    return `${hhmm[1]}:${hhmm[2]}:${hhmm[3] ?? "00"}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour")?.value;
  const mm = parts.find((p) => p.type === "minute")?.value;
  const ss = parts.find((p) => p.type === "second")?.value;
  if (!hh || !mm || !ss) return null;
  return `${hh}:${mm}:${ss}`;
}

function buildDescription(args: {
  description: string | null;
  casts: { name: string }[];
  detailUrl: string;
}): string | null {
  const parts: string[] = [];
  if (args.description) parts.push(args.description);
  if (args.casts.length > 0) {
    parts.push(`出演: ${args.casts.map((c) => c.name).join(", ")}`);
  }
  parts.push(args.detailUrl);
  return parts.length > 0 ? parts.join("\n") : null;
}

export async function GET() {
  const lives = await listLivesForCalendar();
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  const events: IcsEvent[] = lives
    .filter((live) => live.event_date !== null)
    .map((live) => ({
      uid: `live-${live.id}@${host}`,
      date: live.event_date as string,
      startTime: normalizeStartTimeForIcs(live.start_time),
      summary: live.title,
      location: live.venue,
      description: buildDescription({
        description: live.description,
        casts: live.casts,
        detailUrl: `${siteUrl}/lives/${live.id}`,
      }),
      url: live.url,
    }));

  const body = buildIcsCalendar(events, {
    prodId: PRODID,
    calendarName: CALENDAR_NAME,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
