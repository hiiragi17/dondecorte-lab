import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const syncAllChannelsMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/integrations/youtube/sync", () => ({
  syncAllChannels: syncAllChannelsMock,
}));

import { GET } from "./route";

function buildRequest(authorization?: string): Request {
  return new Request("https://example.com/api/cron/youtube", {
    headers: authorization ? { authorization } : {},
  });
}

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

afterEach(() => {
  process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe("GET /api/cron/youtube", () => {
  it("CRON_SECRET 未設定なら 401", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(401);
    expect(syncAllChannelsMock).not.toHaveBeenCalled();
  });

  it("Authorization ヘッダが無ければ 401", async () => {
    const res = await GET(buildRequest());
    expect(res.status).toBe(401);
    expect(syncAllChannelsMock).not.toHaveBeenCalled();
  });

  it("シークレットが一致しなければ 401", async () => {
    const res = await GET(buildRequest("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(syncAllChannelsMock).not.toHaveBeenCalled();
  });

  it("正しいシークレットなら同期を実行して結果を返す", async () => {
    syncAllChannelsMock.mockResolvedValue({
      channels: 1,
      inserted: 2,
      outcomes: [
        {
          channelId: "UC_abc",
          ok: true,
          result: {
            fetched: 3,
            inserted: 2,
            skipped: 1,
            insertedVideoIds: ["a", "b"],
          },
        },
      ],
    });

    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, channels: 1, inserted: 2 });
    expect(syncAllChannelsMock).toHaveBeenCalledTimes(1);
  });

  it("登録チャンネルがあるのに全件失敗したら 500 / ok:false を返す", async () => {
    syncAllChannelsMock.mockResolvedValue({
      channels: 2,
      inserted: 0,
      outcomes: [
        { channelId: "UC_a", ok: false, error: "boom" },
        { channelId: "UC_b", ok: false, error: "boom" },
      ],
    });

    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, channels: 2 });
  });

  it("一部失敗でも1件でも成功していれば 200 / ok:true を返す", async () => {
    syncAllChannelsMock.mockResolvedValue({
      channels: 2,
      inserted: 1,
      outcomes: [
        { channelId: "UC_a", ok: false, error: "boom" },
        {
          channelId: "UC_b",
          ok: true,
          result: { fetched: 1, inserted: 1, skipped: 0, insertedVideoIds: ["x"] },
        },
      ],
    });

    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, channels: 2 });
  });

  it("登録チャンネルが0件なら 200 / ok:true を返す", async () => {
    syncAllChannelsMock.mockResolvedValue({
      channels: 0,
      inserted: 0,
      outcomes: [],
    });

    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, channels: 0 });
  });

  it("同期が例外を投げたら 500 を返す", async () => {
    syncAllChannelsMock.mockRejectedValue(new Error("boom"));
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "boom" });
  });
});
