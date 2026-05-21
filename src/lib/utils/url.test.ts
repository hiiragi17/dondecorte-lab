import { describe, expect, it } from "vitest";
import { normalizeExternalUrl } from "./url";

describe("normalizeExternalUrl", () => {
  it("有効な https URL を正規化して返す", () => {
    expect(normalizeExternalUrl("https://example.com/foo")).toBe(
      "https://example.com/foo"
    );
  });

  it("有効な http URL を正規化して返す", () => {
    expect(normalizeExternalUrl("http://example.com/")).toBe(
      "http://example.com/"
    );
  });

  it("前後の空白をトリミングする", () => {
    expect(normalizeExternalUrl("  https://example.com  ")).toBe(
      "https://example.com/"
    );
  });

  it("null や undefined、空文字に対して null を返す", () => {
    expect(normalizeExternalUrl(null)).toBeNull();
    expect(normalizeExternalUrl(undefined)).toBeNull();
    expect(normalizeExternalUrl("")).toBeNull();
    expect(normalizeExternalUrl("   ")).toBeNull();
  });

  it("不正な URL に対して null を返す", () => {
    expect(normalizeExternalUrl("not-a-url")).toBeNull();
  });

  it("http/https 以外のスキームに対して null を返す", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("ftp://example.com")).toBeNull();
    expect(normalizeExternalUrl("file:///etc/passwd")).toBeNull();
  });
});
