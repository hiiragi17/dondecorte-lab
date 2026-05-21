import { describe, expect, it } from "vitest";
import { normalizeStartTimeForIcs } from "./start-time";

describe("normalizeStartTimeForIcs", () => {
  it("null / 空文字は null を返す", () => {
    expect(normalizeStartTimeForIcs(null)).toBeNull();
    expect(normalizeStartTimeForIcs("")).toBeNull();
  });

  it("HH:MM 形式は HH:MM:00 に整える", () => {
    expect(normalizeStartTimeForIcs("19:30")).toBe("19:30:00");
  });

  it("HH:MM:SS 形式はそのまま返す", () => {
    expect(normalizeStartTimeForIcs("19:30:45")).toBe("19:30:45");
  });

  it("ISO 8601 (+09:00) を JST 時刻として返す", () => {
    expect(normalizeStartTimeForIcs("2026-05-14T19:30:00+09:00")).toBe(
      "19:30:00"
    );
  });

  it("ISO 8601 (UTC Z) は JST に変換した時刻を返す", () => {
    // 2026-05-14T10:30:00Z は JST で 19:30
    expect(normalizeStartTimeForIcs("2026-05-14T10:30:00.000Z")).toBe(
      "19:30:00"
    );
  });

  it("ISO 8601 で日付境界をまたいでも JST 時刻のみ返す", () => {
    // 2026-05-14T16:00:00Z は JST で 翌日 01:00
    expect(normalizeStartTimeForIcs("2026-05-14T16:00:00.000Z")).toBe(
      "01:00:00"
    );
  });

  it("不正な文字列は null を返す", () => {
    expect(normalizeStartTimeForIcs("not-a-time")).toBeNull();
  });
});
