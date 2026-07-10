import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildSearchUrl,
  discoveryUrl,
  fetchPolite,
  presaleWatchUrl,
  USER_AGENT,
} from "./client";

const originalFetch = global.fetch;

function mockResponse(
  body: string,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return {
    status,
    text: async () => body,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as Response;
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("buildSearchUrl", () => {
  it("フィルタ無しは search_string で keyword を積む", () => {
    const u = new URL(buildSearchUrl("ドンデコルテ"));
    expect(u.origin + u.pathname).toBe(
      "https://ticket.fany.lol/search/event"
    );
    expect(u.searchParams.get("keywords")).toBe("ドンデコルテ");
    expect(u.searchParams.get("search_type")).toBe("search_string");
    expect(u.searchParams.get("prefectures")).toBe("0");
    expect(u.searchParams.get("genre")).toBe("0");
  });

  it("フィルタ有りは form + ngk_* を積む", () => {
    const u = new URL(buildSearchUrl("x", { beforeReception: true, sale: true }));
    expect(u.searchParams.get("search_type")).toBe("form");
    expect(u.searchParams.get("ngk_beforeReception")).toBe("on");
    expect(u.searchParams.get("ngk_sale")).toBe("on");
    expect(u.searchParams.get("ngk_accepting")).toBeNull();
  });
});

describe("discoveryUrl / presaleWatchUrl", () => {
  it("discoveryUrl は先行受付前/受付中 + 先着発売前/発売中の 4 フィルタ", () => {
    const u = new URL(discoveryUrl());
    expect(u.searchParams.get("search_type")).toBe("form");
    expect(u.searchParams.get("keywords")).toBe("ドンデコルテ");
    expect(u.searchParams.get("ngk_beforeReception")).toBe("on");
    expect(u.searchParams.get("ngk_accepting")).toBe("on");
    expect(u.searchParams.get("ngk_beforesale")).toBe("on");
    expect(u.searchParams.get("ngk_sale")).toBe("on");
  });

  it("presaleWatchUrl は先行の 2 フィルタだけ", () => {
    const u = new URL(presaleWatchUrl());
    expect(u.searchParams.get("ngk_beforeReception")).toBe("on");
    expect(u.searchParams.get("ngk_accepting")).toBe("on");
    expect(u.searchParams.get("ngk_beforesale")).toBeNull();
    expect(u.searchParams.get("ngk_sale")).toBeNull();
  });
});

describe("USER_AGENT", () => {
  it("プロジェクト名と連絡先を含む", () => {
    expect(USER_AGENT).toContain("DonDecorteLabBot/1.0");
    expect(USER_AGENT).toContain("contact=");
  });
});

describe("fetchPolite", () => {
  it("200 なら html と etag を返す", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse("<html>ok</html>", 200, { etag: '"abc"' }));
    const r = await fetchPolite("https://ticket.fany.lol/x");
    expect(r.status).toBe(200);
    expect(r.html).toBe("<html>ok</html>");
    expect(r.etag).toBe('"abc"');
  });

  it("If-None-Match を送り 304 なら空 html で早期リターンする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse("", 304));
    global.fetch = fetchMock;
    const r = await fetchPolite("https://ticket.fany.lol/x", { etag: '"abc"' });
    expect(r.status).toBe(304);
    expect(r.html).toBe("");
    expect(r.etag).toBe('"abc"');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["If-None-Match"]).toBe('"abc"');
    expect(headers["User-Agent"]).toBe(USER_AGENT);
  });

  it("想定外ステータスは即 throw する", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse("nope", 404));
    await expect(fetchPolite("https://ticket.fany.lol/x")).rejects.toThrow(
      /Unexpected status 404/
    );
  });

  it("5xx はバックオフでリトライし、回復すれば html を返す", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(mockResponse("", 503))
        .mockResolvedValueOnce(mockResponse("<html>ok</html>", 200));
      global.fetch = fetchMock;

      const promise = fetchPolite("https://ticket.fany.lol/x");
      await vi.runAllTimersAsync();
      const r = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(r.status).toBe(200);
      expect(r.html).toBe("<html>ok</html>");
    } finally {
      vi.useRealTimers();
    }
  });
});
