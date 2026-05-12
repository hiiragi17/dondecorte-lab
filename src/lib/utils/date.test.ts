import { describe, expect, it } from "vitest";
import { formatDate, formatTime } from "./date";

describe("formatDate", () => {
  it("YYYY-MM-DD 形式を日本語の年月日に整形する", () => {
    expect(formatDate("2026-05-12")).toBe("2026年5月12日");
  });

  it("ゼロ詰めを取り除いて整形する", () => {
    expect(formatDate("2026-01-03")).toBe("2026年1月3日");
  });

  it("UTC の ISO 8601 文字列を Asia/Tokyo の日付に変換する", () => {
    // 2026-05-11T15:00:00Z は JST で 2026-05-12T00:00:00
    expect(formatDate("2026-05-11T15:00:00.000Z")).toBe("2026年5月12日");
  });

  it("UTC の深夜は JST では翌日として扱われる", () => {
    // 2026-05-11T16:00:00Z は JST で 2026-05-12T01:00:00
    expect(formatDate("2026-05-11T16:00:00.000Z")).toBe("2026年5月12日");
  });

  it("null や空文字に対して null を返す", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("")).toBeNull();
  });

  it("不正な日付文字列に対して null を返す", () => {
    expect(formatDate("not-a-date")).toBeNull();
  });
});

describe("formatTime", () => {
  it("HH:MM 形式をそのまま返す", () => {
    expect(formatTime("19:30")).toBe("19:30");
  });

  it("HH:MM:SS 形式を HH:MM に切り詰める", () => {
    expect(formatTime("19:30:45")).toBe("19:30");
  });

  it("UTC の ISO 8601 文字列を Asia/Tokyo の HH:MM に変換する", () => {
    // 2026-05-12T10:30:00Z は JST で 19:30
    expect(formatTime("2026-05-12T10:30:00.000Z")).toBe("19:30");
  });

  it("null や空文字に対して null を返す", () => {
    expect(formatTime(null)).toBeNull();
    expect(formatTime("")).toBeNull();
  });

  it("不正な時刻文字列に対して null を返す", () => {
    expect(formatTime("not-a-time")).toBeNull();
  });
});
