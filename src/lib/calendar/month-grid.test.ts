import { describe, expect, it } from "vitest";
import {
  buildMonthMatrix,
  parseYearMonth,
  shiftMonth,
  todayInTokyo,
} from "./month-grid";

describe("parseYearMonth", () => {
  it("YYYY-MM をパースする", () => {
    expect(parseYearMonth("2026-06", 2000, 1)).toEqual({ year: 2026, month: 6 });
  });

  it("不正値はフォールバック", () => {
    expect(parseYearMonth("bad", 2026, 5)).toEqual({ year: 2026, month: 5 });
    expect(parseYearMonth("2026-13", 2026, 5)).toEqual({ year: 2026, month: 5 });
    expect(parseYearMonth(undefined, 2026, 5)).toEqual({ year: 2026, month: 5 });
  });
});

describe("shiftMonth", () => {
  it("年をまたいで前後に移動する", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe("buildMonthMatrix", () => {
  it("6週×7日 = 42セルを返す", () => {
    const matrix = buildMonthMatrix(2026, 6, "2026-06-15");
    expect(matrix.length).toBe(6);
    expect(matrix.flat().length).toBe(42);
  });

  it("日曜始まりで月初・月末の前後日が埋まる", () => {
    // 2026-06-01 は月曜。先頭セルは前月の日曜 2026-05-31。
    const matrix = buildMonthMatrix(2026, 6, "2026-06-15");
    const flat = matrix.flat();
    expect(flat[0].date).toBe("2026-05-31");
    expect(flat[0].inCurrentMonth).toBe(false);
    const june1 = flat.find((c) => c.date === "2026-06-01");
    expect(june1?.inCurrentMonth).toBe(true);
  });

  it("today フラグが立つ", () => {
    const matrix = buildMonthMatrix(2026, 6, "2026-06-15");
    const today = matrix.flat().find((c) => c.isToday);
    expect(today?.date).toBe("2026-06-15");
  });
});

describe("todayInTokyo", () => {
  it("Asia/Tokyo の YYYY-MM-DD を返す", () => {
    // UTC 2026-06-01 16:00 は JST で 2026-06-02 01:00。
    expect(todayInTokyo(new Date("2026-06-01T16:00:00Z"))).toBe("2026-06-02");
  });
});
