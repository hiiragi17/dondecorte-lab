import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__REDIRECT__:${url}`);
  }),
}));

const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

import { createLive, updateLive, deleteLive } from "./lives";

function buildFormData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  supabaseMock.from.mockReset();
  supabaseMock.rpc.mockReset();
});

describe("createLive", () => {
  it("タイトルが空ならエラーを返す", async () => {
    const fd = buildFormData({ title: "" });
    const result = await createLive({}, fd);
    expect(result.fieldErrors?.title).toBe("タイトルを入力してください");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("タイトルが200文字を超えるとエラーを返す", async () => {
    const fd = buildFormData({ title: "あ".repeat(201) });
    const result = await createLive({}, fd);
    expect(result.fieldErrors?.title).toBe("200文字以内で入力してください");
  });

  it("event_date が不正な形式の場合はエラーを返す", async () => {
    const fd = buildFormData({
      title: "テストライブ",
      event_date: "2026/05/01",
    });
    const result = await createLive({}, fd);
    expect(result.fieldErrors?.event_date).toBe(
      "開催日はYYYY-MM-DD形式で入力してください"
    );
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("event_date が存在しない日付（2026-02-30 など）の場合はエラーを返す", async () => {
    const fd = buildFormData({
      title: "テストライブ",
      event_date: "2026-02-30",
    });
    const result = await createLive({}, fd);
    expect(result.fieldErrors?.event_date).toBe(
      "開催日はYYYY-MM-DD形式で入力してください"
    );

    const fd2 = buildFormData({
      title: "テストライブ",
      event_date: "2026-13-01",
    });
    const result2 = await createLive({}, fd2);
    expect(result2.fieldErrors?.event_date).toBeDefined();
  });

  it("event_date が空でも作成は進む（必須ではない）", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({ title: "テスト" });
    await expect(createLive({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "live",
        p_content: expect.objectContaining({
          event_date: null,
          start_time: null,
        }),
      })
    );
  });

  it("event_date と start_time から ISO 形式の開始時刻を組み立てる", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({
      title: "テスト",
      event_date: "2026-05-14",
      start_time: "19:30",
    });
    await expect(createLive({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "live",
        p_content: expect.objectContaining({
          event_date: "2026-05-14",
          start_time: "2026-05-14T19:30:00",
        }),
      })
    );
  });

  it("認証されていない場合はエラーを返す", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    const fd = buildFormData({ title: "テスト" });
    const result = await createLive({}, fd);
    expect(result.error).toBe("認証が必要です");
  });
});

describe("updateLive", () => {
  it("IDがUUID形式でない場合はエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト" });
    const result = await updateLive("invalid", {}, fd);
    expect(result.error).toBe("IDが不正です");
  });

  it("バリデーションエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト", event_date: "不正" });
    const result = await updateLive(
      "11111111-1111-4111-8111-111111111111",
      {},
      fd
    );
    expect(result.fieldErrors?.event_date).toBeDefined();
  });
});

describe("deleteLive", () => {
  it("IDが空なら何もせず終了する", async () => {
    const fd = buildFormData({ id: "" });
    await expect(deleteLive(fd)).resolves.toBeUndefined();
  });

  it("IDがUUID形式でない場合は例外を投げる", async () => {
    const fd = buildFormData({ id: "not-a-uuid" });
    await expect(deleteLive(fd)).rejects.toThrow("IDが不正です");
  });
});
