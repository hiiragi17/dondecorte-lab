import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PushSubscriptionRow } from "@/lib/types/push";

vi.mock("server-only", () => ({}));

const webpushMock = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));
vi.mock("web-push", () => ({ default: webpushMock }));

const adminMock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: adminMock }));

import { broadcastPush, sendPush } from "./sender";

const eqSpy = vi.fn();
const deleteSpy = vi.fn(() => ({ eq: eqSpy }));
const selectSpy = vi.fn();

function buildSubscription(
  overrides: Partial<PushSubscriptionRow> = {}
): PushSubscriptionRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    endpoint: "https://push.example.com/abc",
    p256dh: "p256dh-key",
    auth: "auth-secret",
    user_agent: "Test UA",
    created_at: "2026-05-16T00:00:00Z",
    last_seen_at: "2026-05-16T00:00:00Z",
    ...overrides,
  };
}

function goneError(statusCode: number): Error {
  return Object.assign(new Error("subscription gone"), { statusCode });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public-key";
  process.env.VAPID_PRIVATE_KEY = "private-key";
  process.env.VAPID_SUBJECT = "mailto:test@example.com";
  eqSpy.mockResolvedValue({ error: null });
  selectSpy.mockResolvedValue({ data: [], error: null });
  adminMock.from.mockReturnValue({ select: selectSpy, delete: deleteSpy });
  webpushMock.sendNotification.mockResolvedValue(undefined);
});

describe("sendPush", () => {
  it("送信に成功したら ok:true を返し、行は削除しない", async () => {
    const sub = buildSubscription();
    const result = await sendPush(sub, { title: "T", body: "B" });

    expect(result).toEqual({ ok: true });
    expect(webpushMock.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({ title: "T", body: "B" })
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("410 が返ったら gone:true で push_subscriptions から削除する", async () => {
    webpushMock.sendNotification.mockRejectedValueOnce(goneError(410));
    const sub = buildSubscription();

    const result = await sendPush(sub, { title: "T", body: "B" });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, gone: true });
    expect(adminMock.from).toHaveBeenCalledWith("push_subscriptions");
    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith("endpoint", sub.endpoint);
  });

  it("404 が返ったら gone:true で削除する", async () => {
    webpushMock.sendNotification.mockRejectedValueOnce(goneError(404));

    const result = await sendPush(buildSubscription(), {
      title: "T",
      body: "B",
    });

    expect(result).toMatchObject({ ok: false, gone: true });
    expect(deleteSpy).toHaveBeenCalled();
  });

  it("失効以外のエラーは gone:false で削除しない", async () => {
    webpushMock.sendNotification.mockRejectedValueOnce(goneError(500));

    const result = await sendPush(buildSubscription(), {
      title: "T",
      body: "B",
    });

    expect(result).toMatchObject({ ok: false, gone: false });
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

describe("broadcastPush", () => {
  it("成功・失効・失敗の件数を集計する", async () => {
    selectSpy.mockResolvedValueOnce({
      data: [
        buildSubscription({ endpoint: "https://push.example.com/ok" }),
        buildSubscription({ endpoint: "https://push.example.com/gone" }),
        buildSubscription({ endpoint: "https://push.example.com/fail" }),
      ],
      error: null,
    });
    webpushMock.sendNotification
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(goneError(410))
      .mockRejectedValueOnce(goneError(500));

    const result = await broadcastPush({ title: "T", body: "B" });

    expect(result).toEqual({ sent: 1, failed: 2, removed: 1 });
  });

  it("購読が無ければ全て 0 件", async () => {
    const result = await broadcastPush({ title: "T", body: "B" });
    expect(result).toEqual({ sent: 0, failed: 0, removed: 0 });
  });

  it("購読一覧の取得に失敗したら例外を投げる", async () => {
    selectSpy.mockResolvedValueOnce({
      data: null,
      error: { message: "db error" },
    });

    await expect(broadcastPush({ title: "T", body: "B" })).rejects.toThrow(
      /購読端末一覧の取得に失敗/
    );
  });
});
