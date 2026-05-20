import { describe, expect, it } from "vitest";
import {
  buildIcsCalendar,
  escapeIcsText,
  foldIcsLine,
  type IcsEvent,
} from "./builder";

const FIXED_NOW = new Date("2026-05-20T03:00:00.000Z");

const baseOptions = {
  prodId: "-//dondecorte-lab//Lives//JA",
  calendarName: "ドンデコルテ出演ライブ",
  now: FIXED_NOW,
};

describe("escapeIcsText", () => {
  it("カンマ・セミコロン・バックスラッシュ・改行をエスケープする", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("CRLF と CR を単一の \\n に統一する", () => {
    expect(escapeIcsText("a\r\nb\rc")).toBe("a\\nb\\nc");
  });
});

describe("foldIcsLine", () => {
  it("75 オクテット以下はそのまま返す", () => {
    const line = "SUMMARY:short";
    expect(foldIcsLine(line)).toBe(line);
  });

  it("75 オクテット超は CRLF + space で折り返す", () => {
    const long = "X".repeat(200);
    const folded = foldIcsLine(`SUMMARY:${long}`);
    const segments = folded.split("\r\n");
    expect(segments.length).toBeGreaterThan(1);
    for (const seg of segments) {
      expect(Buffer.byteLength(seg, "utf8")).toBeLessThanOrEqual(76);
    }
    expect(segments.slice(1).every((s) => s.startsWith(" "))).toBe(true);
    const rejoined = segments
      .map((s, i) => (i === 0 ? s : s.slice(1)))
      .join("");
    expect(rejoined).toBe(`SUMMARY:${long}`);
  });

  it("マルチバイト文字をバイト境界で安全に折る", () => {
    const text = "あ".repeat(60);
    const folded = foldIcsLine(`SUMMARY:${text}`);
    for (const seg of folded.split("\r\n")) {
      expect(Buffer.byteLength(seg, "utf8")).toBeLessThanOrEqual(76);
    }
  });
});

describe("buildIcsCalendar", () => {
  it("ヘッダとフッタを含む有効な VCALENDAR を返す", () => {
    const ics = buildIcsCalendar([], baseOptions);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//dondecorte-lab//Lives//JA");
    expect(ics).toContain("X-WR-CALNAME:ドンデコルテ出演ライブ");
    expect(ics).toContain("X-WR-TIMEZONE:Asia/Tokyo");
  });

  it("Asia/Tokyo の VTIMEZONE 定義を含める", () => {
    const ics = buildIcsCalendar([], baseOptions);
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:Asia/Tokyo");
    expect(ics).toContain("TZOFFSETFROM:+0900");
    expect(ics).toContain("TZOFFSETTO:+0900");
    expect(ics).toContain("TZNAME:JST");
    expect(ics).toContain("END:VTIMEZONE");
    // VTIMEZONE は VEVENT より前に置く
    const idxTz = ics.indexOf("BEGIN:VTIMEZONE");
    const idxEvent = ics.indexOf("BEGIN:VEVENT");
    if (idxEvent !== -1) {
      expect(idxTz).toBeLessThan(idxEvent);
    }
  });

  it("不正な startTime は例外を投げる (frontに分かりやすく失敗)", () => {
    const event: IcsEvent = {
      uid: "u",
      date: "2026-06-01",
      startTime: "2026-05-14T19:30:00+09:00",
      summary: "ライブ",
    };
    expect(() => buildIcsCalendar([event], baseOptions)).toThrow(
      /HH:MM/
    );
  });

  it("start_time あり: TZID 付き DTSTART / DTEND を出力する", () => {
    const event: IcsEvent = {
      uid: "live-1@example.com",
      date: "2026-06-01",
      startTime: "19:00",
      summary: "単独ライブ",
    };
    const ics = buildIcsCalendar([event], baseOptions);
    expect(ics).toContain("DTSTART;TZID=Asia/Tokyo:20260601T190000");
    expect(ics).toContain("DTEND;TZID=Asia/Tokyo:20260601T210000");
    expect(ics).toContain("SUMMARY:単独ライブ");
    expect(ics).toContain("UID:live-1@example.com");
    expect(ics).toContain("DTSTAMP:20260520T030000Z");
  });

  it("start_time なし: 終日イベント (VALUE=DATE) として出力する", () => {
    const event: IcsEvent = {
      uid: "live-2@example.com",
      date: "2026-06-01",
      startTime: null,
      summary: "終日イベント",
    };
    const ics = buildIcsCalendar([event], baseOptions);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601");
    expect(ics).toContain("DTEND;VALUE=DATE:20260602");
    expect(ics).not.toContain("TZID=");
  });

  it("durationMinutes を指定すると DTEND が変わる", () => {
    const event: IcsEvent = {
      uid: "u",
      date: "2026-06-01",
      startTime: "23:00",
      durationMinutes: 90,
      summary: "夜ライブ",
    };
    const ics = buildIcsCalendar([event], baseOptions);
    expect(ics).toContain("DTSTART;TZID=Asia/Tokyo:20260601T230000");
    expect(ics).toContain("DTEND;TZID=Asia/Tokyo:20260602T003000");
  });

  it("LOCATION / DESCRIPTION / URL を含める", () => {
    const event: IcsEvent = {
      uid: "u",
      date: "2026-06-01",
      startTime: "19:00",
      summary: "ライブ",
      location: "神保町よしもと漫才劇場",
      description: "出演: 渡辺銀次, 小橋共作",
      url: "https://example.com/live/1",
    };
    const ics = buildIcsCalendar([event], baseOptions);
    expect(ics).toContain("LOCATION:神保町よしもと漫才劇場");
    expect(ics).toContain("DESCRIPTION:出演: 渡辺銀次\\, 小橋共作");
    expect(ics).toContain("URL:https://example.com/live/1");
  });

  it("空欄の location / description / url は省略する", () => {
    const event: IcsEvent = {
      uid: "u",
      date: "2026-06-01",
      startTime: "19:00",
      summary: "ライブ",
      location: null,
      description: null,
      url: null,
    };
    const ics = buildIcsCalendar([event], baseOptions);
    expect(ics).not.toContain("LOCATION:");
    expect(ics).not.toContain("DESCRIPTION:");
    expect(ics).not.toContain("URL:");
  });

  it("複数イベントを順番に並べる", () => {
    const events: IcsEvent[] = [
      {
        uid: "a",
        date: "2026-06-01",
        startTime: "19:00",
        summary: "A",
      },
      {
        uid: "b",
        date: "2026-06-02",
        startTime: null,
        summary: "B",
      },
    ];
    const ics = buildIcsCalendar(events, baseOptions);
    const vevents = ics.split("BEGIN:VEVENT").length - 1;
    expect(vevents).toBe(2);
    expect(ics.indexOf("UID:a")).toBeLessThan(ics.indexOf("UID:b"));
  });

  it("行末は全て CRLF", () => {
    const event: IcsEvent = {
      uid: "u",
      date: "2026-06-01",
      startTime: "19:00",
      summary: "ライブ",
    };
    const ics = buildIcsCalendar([event], baseOptions);
    const withoutCrlf = ics.replace(/\r\n/g, "");
    expect(withoutCrlf.includes("\n")).toBe(false);
  });
});
