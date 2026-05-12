import { describe, expect, it } from "vitest";
import { formatDate, formatTime } from "./date";

describe("formatDate", () => {
  it("YYYY-MM-DD 形式を日本語の年月日に整形する", () => {
    expect(formatDate("2026-05-12")).toBe("2026年5月12日");
  });

  it("ゼロ詰めを取り除いて整形する", () => {
    expect(formatDate("2026-01-03")).toBe("2026年1月3日");
  });

  it("ISO 8601 形式の文字列を Asia/Tokyo の日付に整形する", () => {
    const result = formatDate("2026-05-12T00:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("5");
    expect(result).toContain("12");
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

  it("ISO 8601 形式の文字列を Asia/Tokyo の HH:MM に整形する", () => {
    const result = formatTime("2026-05-12T10:30:00.000Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("null や空文字に対して null を返す", () => {
    expect(formatTime(null)).toBeNull();
    expect(formatTime("")).toBeNull();
  });

  it("不正な時刻文字列に対して null を返す", () => {
    expect(formatTime("not-a-time")).toBeNull();
  });
});
