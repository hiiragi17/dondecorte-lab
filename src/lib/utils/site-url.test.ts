import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  const original = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.VERCEL_URL,
  };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    if (original.siteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = original.siteUrl;
    }
    if (original.vercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = original.vercelUrl;
    }
  });

  it("NEXT_PUBLIC_SITE_URL を優先して origin を返す", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://dondecorte.example.com/path/";
    expect(getSiteUrl()).toBe("https://dondecorte.example.com");
  });

  it("VERCEL_URL からスキームを補完して origin を返す", () => {
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(getSiteUrl()).toBe("https://preview.vercel.app");
  });

  it("NEXT_PUBLIC_SITE_URL が VERCEL_URL より優先される", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://explicit.example.com";
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(getSiteUrl()).toBe("https://explicit.example.com");
  });

  it("末尾スラッシュを除去する", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com////";
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("いずれも未設定なら localhost を返す", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("NEXT_PUBLIC_SITE_URL が不正な値なら VERCEL_URL を使う", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(getSiteUrl()).toBe("https://preview.vercel.app");
  });
});
