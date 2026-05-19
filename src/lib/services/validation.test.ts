import { describe, expect, it } from "vitest";
import {
  isUuid,
  isValidEventDate,
  isValidHttpUrl,
  toNullableString,
  validateTitle,
} from "./validation";

describe("isUuid", () => {
  it("正しいUUIDを受理する", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("UUID形式でない文字列を拒否する", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("toNullableString", () => {
  it("空文字・空白のみは null を返す", () => {
    expect(toNullableString("")).toBeNull();
    expect(toNullableString("   ")).toBeNull();
  });

  it("文字列以外（File など）は null を返す", () => {
    expect(toNullableString(null)).toBeNull();
    expect(toNullableString(new File([], "x"))).toBeNull();
  });

  it("前後の空白を除去して返す", () => {
    expect(toNullableString("  hello  ")).toBe("hello");
  });
});

describe("validateTitle", () => {
  it("空ならエラーメッセージを返す", () => {
    expect(validateTitle("")).toBe("タイトルを入力してください");
  });

  it("空白のみならエラーメッセージを返す", () => {
    expect(validateTitle("   ")).toBe("タイトルを入力してください");
  });

  it("200文字を超えるとエラーメッセージを返す", () => {
    expect(validateTitle("あ".repeat(201))).toBe(
      "200文字以内で入力してください"
    );
  });

  it("妥当なタイトルは undefined を返す", () => {
    expect(validateTitle("テスト")).toBeUndefined();
    expect(validateTitle("あ".repeat(200))).toBeUndefined();
  });
});

describe("isValidHttpUrl", () => {
  it("http/https を受理する", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  it("http/https 以外のスキームや不正な値を拒否する", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
  });
});

describe("isValidEventDate", () => {
  it("YYYY-MM-DD 形式の実在する日付を受理する", () => {
    expect(isValidEventDate("2026-05-14")).toBe(true);
  });

  it("形式不正・存在しない日付を拒否する", () => {
    expect(isValidEventDate("2026/05/01")).toBe(false);
    expect(isValidEventDate("2026-02-30")).toBe(false);
    expect(isValidEventDate("2026-13-01")).toBe(false);
  });
});
