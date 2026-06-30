import { buildIcsCalendar, type IcsEvent } from "@/lib/ics/builder";
import { buildLiveIcsEvents } from "@/lib/ics/live-events";
import { listLivesForCalendar } from "@/lib/queries/lives";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const PRODID = "-//dondecorte-lab//Lives//JA";
const CALENDAR_NAME = "ドンデコルテ出演ライブ";

export async function GET() {
  const lives = await listLivesForCalendar();
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  const events: IcsEvent[] = lives.flatMap((live) =>
    buildLiveIcsEvents(live, { siteUrl, host })
  );

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
