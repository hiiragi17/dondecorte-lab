import {
  ALL_DAY_LIVE_REMINDERS,
  buildLiveCalendarDescription,
  TIMED_LIVE_REMINDERS,
} from "@/lib/calendar/live-event";
import { buildIcsCalendar, type IcsEvent } from "@/lib/ics/builder";
import { normalizeStartTimeForIcs } from "@/lib/ics/start-time";
import { getLive } from "@/lib/queries/lives";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const PRODID = "-//dondecorte-lab//Live//JA";
const CALENDAR_NAME = "ドンデコルテ出演ライブ";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const live = await getLive(id);
  if (!live || !live.event_date) {
    return new Response("Not Found", { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;
  const startTime = normalizeStartTimeForIcs(live.start_time);

  const event: IcsEvent = {
    uid: `live-${live.id}@${host}`,
    date: live.event_date,
    startTime,
    summary: live.title,
    location: live.venue,
    description: buildLiveCalendarDescription({
      description: live.description,
      casts: live.casts,
      detailUrl: `${siteUrl}/lives/${live.id}`,
    }),
    url: live.url,
    reminders: startTime ? TIMED_LIVE_REMINDERS : ALL_DAY_LIVE_REMINDERS,
  };

  const body = buildIcsCalendar([event], {
    prodId: PRODID,
    calendarName: CALENDAR_NAME,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="dondecorte-live-${live.id}.ics"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
