import { buildLiveCalendarDescription } from "@/lib/calendar/live-event";
import { buildIcsCalendar, type IcsEvent } from "@/lib/ics/builder";
import { normalizeStartTimeForIcs } from "@/lib/ics/start-time";
import { listLivesForCalendar } from "@/lib/queries/lives";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const PRODID = "-//dondecorte-lab//Lives//JA";
const CALENDAR_NAME = "ドンデコルテ出演ライブ";

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
      description: buildLiveCalendarDescription({
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
