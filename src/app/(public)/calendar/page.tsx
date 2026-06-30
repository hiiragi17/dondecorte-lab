import type { Metadata } from "next";
import { CalendarView } from "@/components/features/calendar/calendar-view";
import { parseYearMonth, todayInTokyo } from "@/lib/calendar/month-grid";
import { listCalendarEntries } from "@/lib/queries/calendar";
import { listLivesForCalendar } from "@/lib/queries/lives";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "ドンデコルテさん関連のライブ・イベント・抽選/販売期間などをカレンダーで確認できます。";

export const metadata: Metadata = {
  title: "カレンダー",
  description: DESCRIPTION,
  alternates: { canonical: "/calendar" },
  openGraph: {
    title: "カレンダー",
    description: DESCRIPTION,
    url: "/calendar",
  },
};

type SearchParams = Promise<{ ym?: string | string[] }>;

function ymParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const today = todayInTokyo();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const { year, month } = parseYearMonth(
    ymParam(params.ym),
    todayYear,
    todayMonth
  );

  const [entries, lives] = await Promise.all([
    listCalendarEntries(),
    listLivesForCalendar(),
  ]);
  const siteUrl = getSiteUrl();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-cream md:text-3xl">
          カレンダー
        </h1>
        <p className="mt-2 text-sm text-brand-gold md:text-base">
          {DESCRIPTION}
        </p>
      </header>

      <CalendarView
        entries={entries}
        lives={lives}
        siteUrl={siteUrl}
        today={today}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
