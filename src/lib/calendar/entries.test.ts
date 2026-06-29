import { describe, expect, it } from "vitest";
import { buildCalendarEntries, tokyoDateOf } from "./entries";

describe("tokyoDateOf", () => {
  it("YYYY-MM-DD はそのまま返す", () => {
    expect(tokyoDateOf("2026-06-01")).toBe("2026-06-01");
  });

  it("UTC タイムスタンプを Asia/Tokyo の日付へ変換する", () => {
    // 2026-06-01T16:00:00Z は JST では翌日 01:00。
    expect(tokyoDateOf("2026-06-01T16:00:00Z")).toBe("2026-06-02");
  });

  it("不正な値は null", () => {
    expect(tokyoDateOf("not-a-date")).toBeNull();
  });
});

describe("buildCalendarEntries", () => {
  it("タイムラインの点イベントを種別マップ付きで変換する（live→event）", () => {
    const entries = buildCalendarEntries({
      timeline: [
        {
          type: "live",
          id: "l1",
          title: "単独ライブ",
          date: "2026-06-20",
          href: "/lives/l1",
        },
        {
          type: "tv_show",
          id: "t1",
          title: "TV出演",
          date: "2026-06-21",
          href: "/tv/t1",
        },
      ],
      schedules: [],
    });
    expect(entries).toEqual([
      {
        key: "live-l1",
        category: "event",
        title: "単独ライブ",
        startDate: "2026-06-20",
        endDate: null,
        startTime: null,
        href: "/lives/l1",
      },
      {
        key: "tv_show-t1",
        category: "tv",
        title: "TV出演",
        startDate: "2026-06-21",
        endDate: null,
        startTime: null,
        href: "/tv/t1",
      },
    ]);
  });

  it("日付が null の点イベントは除外する", () => {
    const entries = buildCalendarEntries({
      timeline: [
        { type: "video", id: "v1", title: "動画", date: null, href: "/videos/v1" },
      ],
      schedules: [],
    });
    expect(entries).toEqual([]);
  });

  it("チケットスケジュールを期間エントリへ変換する", () => {
    const entries = buildCalendarEntries({
      timeline: [],
      schedules: [
        {
          id: "s1",
          liveId: "l1",
          phase: "lottery",
          label: null,
          liveTitle: "対バンライブ",
          startDate: "2026-06-01",
          endDate: "2026-06-05",
          startTime: null,
        },
        {
          id: "s2",
          liveId: "l1",
          phase: "sale",
          label: "先行販売",
          liveTitle: "対バンライブ",
          startDate: "2026-06-10",
          endDate: null,
          startTime: null,
        },
      ],
    });
    expect(entries).toEqual([
      {
        key: "schedule-s1",
        category: "lottery",
        title: "対バンライブ（抽選）",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        startTime: null,
        href: "/lives/l1",
      },
      {
        key: "schedule-s2",
        category: "sale",
        title: "対バンライブ（先行販売）",
        startDate: "2026-06-10",
        endDate: null,
        startTime: null,
        href: "/lives/l1",
      },
    ]);
  });
});
