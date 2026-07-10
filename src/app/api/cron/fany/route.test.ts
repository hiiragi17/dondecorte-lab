import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const syncFanyMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/integrations/fany/sync", () => ({
  syncFany: syncFanyMock,
}));

import { GET } from "./route";

function buildRequest(authorization?: string): Request {
  return new Request("https://example.com/api/cron/fany", {
    headers: authorization ? { authorization } : {},
  });
}

const ORIGINAL_SECRET = process.env.CRON_SECRET;
const ORIGINAL_ENABLED = process.env.FANY_SYNC_ENABLED;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  process.env.FANY_SYNC_ENABLED = "true"; // 各テストの既定は有効。無効化は個別に上書き。
});

afterEach(() => {
  process.env.CRON_SECRET = ORIGINAL_SECRET;
  if (ORIGINAL_ENABLED === undefined) delete process.env.FANY_SYNC_ENABLED;
  else process.env.FANY_SYNC_ENABLED = ORIGINAL_ENABLED;
});

describe("GET /api/cron/fany", () => {
  it("CRON_SECRET 未設定なら 401", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(401);
    expect(syncFanyMock).not.toHaveBeenCalled();
  });

  it("Authorization ヘッダが無ければ 401", async () => {
    const res = await GET(buildRequest());
    expect(res.status).toBe(401);
    expect(syncFanyMock).not.toHaveBeenCalled();
  });

  it("シークレットが一致しなければ 401", async () => {
    const res = await GET(buildRequest("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(syncFanyMock).not.toHaveBeenCalled();
  });

  it("正しいシークレットなら同期を実行して結果を返す", async () => {
    syncFanyMock.mockResolvedValue({
      notModified: false,
      fetched: 5,
      targetEvents: 2,
      newLives: 1,
      newSchedules: 3,
      pushed: 4,
    });

    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, targetEvents: 2, newLives: 1 });
    expect(syncFanyMock).toHaveBeenCalledTimes(1);
  });

  it("FANY_SYNC_ENABLED 未設定なら同期せず disabled を返す（既定は無効）", async () => {
    delete process.env.FANY_SYNC_ENABLED;
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, disabled: true });
    expect(syncFanyMock).not.toHaveBeenCalled();
  });

  it("FANY_SYNC_ENABLED が 'true' 以外なら無効扱い", async () => {
    process.env.FANY_SYNC_ENABLED = "1";
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, disabled: true });
    expect(syncFanyMock).not.toHaveBeenCalled();
  });

  it("同期が例外を投げたら 500 を返す", async () => {
    syncFanyMock.mockRejectedValue(new Error("boom"));
    const res = await GET(buildRequest("Bearer test-secret"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "boom" });
  });
});
