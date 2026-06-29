import { buildIcsCalendar } from "@/lib/ics/builder";
import { buildLiveIcsEvents } from "@/lib/ics/live-events";
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
  if (!live || (!live.event_date && live.schedules.length === 0)) {
    return new Response("Not Found", { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  const events = buildLiveIcsEvents(live, { siteUrl, host });

  const body = buildIcsCalendar(events, {
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
