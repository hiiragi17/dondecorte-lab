import { describe, expect, it } from "vitest";
import { buildGoogleCalendarUrl } from "./google-url";

function parse(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe("buildGoogleCalendarUrl", () => {
  it("render エンドポイント + action=TEMPLATE を使う", () => {
    const url = buildGoogleCalendarUrl({
      title: "単独ライブ",
      date: "2026-06-01",
      startTime: "19:00",
    });
    expect(url.startsWith("https://calendar.google.com/calendar/render?")).toBe(
      true
    );
    expect(parse(url).get("action")).toBe("TEMPLATE");
    expect(parse(url).get("text")).toBe("単独ライブ");
  });

  it("時刻指定: dates を local 連結 + ctz=Asia/Tokyo を付与", () => {
    const url = buildGoogleCalendarUrl({
      title: "ライブ",
      date: "2026-06-01",
      startTime: "19:00",
    });
    const params = parse(url);
    expect(params.get("dates")).toBe("20260601T190000/20260601T210000");
    expect(params.get("ctz")).toBe("Asia/Tokyo");
  });

  it("durationMinutes で終了時刻が変わる", () => {
    const url = buildGoogleCalendarUrl({
      title: "夜ライブ",
      date: "2026-06-01",
      startTime: "23:00",
      durationMinutes: 90,
    });
    expect(parse(url).get("dates")).toBe("20260601T230000/20260602T003000");
  });

  it("終日: 終了日を翌日（排他的）にする / ctz は付けない", () => {
    const url = buildGoogleCalendarUrl({
      title: "終日イベント",
      date: "2026-06-01",
      startTime: null,
    });
    const params = parse(url);
    expect(params.get("dates")).toBe("20260601/20260602");
    expect(params.get("ctz")).toBeNull();
  });

  it("終日の複数日: endDate を含む帯にする", () => {
    const url = buildGoogleCalendarUrl({
      title: "先行抽選期間",
      date: "2026-06-01",
      startTime: null,
      endDate: "2026-06-05",
    });
    expect(parse(url).get("dates")).toBe("20260601/20260606");
  });

  it("details / location をエンコードして付与する", () => {
    const url = buildGoogleCalendarUrl({
      title: "ライブ",
      date: "2026-06-01",
      startTime: "19:00",
      details: "出演: 渡辺銀次, 小橋共作\nhttps://example.com/lives/1",
      location: "神保町よしもと漫才劇場",
    });
    const params = parse(url);
    expect(params.get("details")).toBe(
      "出演: 渡辺銀次, 小橋共作\nhttps://example.com/lives/1"
    );
    expect(params.get("location")).toBe("神保町よしもと漫才劇場");
  });

  it("空の details / location は省略する", () => {
    const url = buildGoogleCalendarUrl({
      title: "ライブ",
      date: "2026-06-01",
      startTime: "19:00",
      details: null,
      location: null,
    });
    const params = parse(url);
    expect(params.has("details")).toBe(false);
    expect(params.has("location")).toBe(false);
  });

  it("不正な date は例外", () => {
    expect(() =>
      buildGoogleCalendarUrl({
        title: "x",
        date: "2026/06/01",
        startTime: null,
      })
    ).toThrow(/YYYY-MM-DD/);
  });
});
