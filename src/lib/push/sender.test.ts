import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const webPushMock = vi.hoisted(() => {
  class WebPushError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return {
    sendNotification: vi.fn(),
    setVapidDetails: vi.fn(),
    WebPushError,
  };
});

vi.mock("web-push", () => webPushMock);

const adminMock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: adminMock }));

import { sendPush, sendPushToAll } from "./sender";

const SUB = { endpoint: "https://push.example/abc", p256dh: "p", auth: "a" };
const PAYLOAD = { title: "t", body: "b" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VAPID_PUBLIC_KEY = "pub";
  process.env.VAPID_PRIVATE_KEY = "priv";
  process.env.VAPID_SUBJECT = "mailto:test@example.com";
});

describe("sendPush", () => {
  it("送信成功で true を返す", async () => {
    webPushMock.sendNotification.mockResolvedValueOnce({});
    await expect(sendPush(SUB, PAYLOAD)).resolves.toBe(true);
    expect(webPushMock.sendNotification).toHaveBeenCalledWith(
      { endpoint: SUB.endpoint, keys: { p256dh: "p", auth: "a" } },
      JSON.stringify(PAYLOAD)
    );
  });

  it("410 なら購読を削除して false を返す", async () => {
    webPushMock.sendNotification.mockRejectedValueOnce(
      new webPushMock.WebPushError("gone", 410)
    );
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    adminMock.from.mockReturnValue({ delete: del });

    await expect(sendPush(SUB, PAYLOAD)).resolves.toBe(false);
    expect(adminMock.from).toHaveBeenCalledWith("push_subscriptions");
    expect(eq).toHaveBeenCalledWith("endpoint", SUB.endpoint);
  });

  it("410/404 以外のエラーは再 throw する", async () => {
    webPushMock.sendNotification.mockRejectedValueOnce(
      new webPushMock.WebPushError("boom", 500)
    );
    await expect(sendPush(SUB, PAYLOAD)).rejects.toThrow("boom");
  });

  it("VAPID 環境変数が無いと throw する", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    // 別モジュール状態に依存しないよう動的 import で再評価
    vi.resetModules();
    const { sendPush: freshSendPush } = await import("./sender");
    await expect(freshSendPush(SUB, PAYLOAD)).rejects.toThrow(/VAPID/);
  });
});

describe("sendPushToAll", () => {
  it("成功 / 失効削除 / 失敗を集計する", async () => {
    const subs = [
      { endpoint: "e1", p256dh: "p", auth: "a" },
      { endpoint: "e2", p256dh: "p", auth: "a" },
      { endpoint: "e3", p256dh: "p", auth: "a" },
    ];
    const eq = vi.fn().mockResolvedValue({ error: null });
    adminMock.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: subs, error: null }),
      delete: vi.fn(() => ({ eq })),
    });

    webPushMock.sendNotification
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new webPushMock.WebPushError("gone", 410))
      .mockRejectedValueOnce(new webPushMock.WebPushError("boom", 500));

    const summary = await sendPushToAll(PAYLOAD);
    expect(summary).toEqual({ sent: 1, removed: 1, failed: 1 });
  });
});
