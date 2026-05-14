import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

import { createMemo, updateMemo, deleteMemo } from "./memos";

function buildFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  supabaseMock.from.mockReset();
});

describe("createMemo", () => {
  it("target_type が空ならエラーを返す", async () => {
    const fd = buildFormData({
      target_type: "",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await createMemo({}, fd);
    expect(result.error).toBe("対象種別が不正です");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("target_type が許可外の値ならエラーを返す", async () => {
    const fd = buildFormData({
      target_type: "unknown",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await createMemo({}, fd);
    expect(result.error).toBe("対象種別が不正です");
  });

  it("target_id がUUID形式でない場合はエラーを返す", async () => {
    const fd = buildFormData({
      target_type: "video",
      target_id: "not-a-uuid",
      content: "感想",
    });
    const result = await createMemo({}, fd);
    expect(result.error).toBe("対象IDが不正です");
  });

  it("content が空ならエラーを返す", async () => {
    const fd = buildFormData({
      target_type: "video",
      target_id: VALID_UUID,
      content: "",
    });
    const result = await createMemo({}, fd);
    expect(result.fieldError).toBe("感想を入力してください");
  });

  it("content が2000文字を超える場合はエラーを返す", async () => {
    const fd = buildFormData({
      target_type: "video",
      target_id: VALID_UUID,
      content: "あ".repeat(2001),
    });
    const result = await createMemo({}, fd);
    expect(result.fieldError).toBe("2000文字以内で入力してください");
  });

  it("認証されていない場合はエラーを返す", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    const fd = buildFormData({
      target_type: "video",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await createMemo({}, fd);
    expect(result.error).toBe("認証が必要です");
  });

  it("各コンテンツ種別を許可する", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValue({ insert: insertMock });

    const types = ["video", "live", "radio", "article", "tv_show", "topic"];
    for (const type of types) {
      const fd = buildFormData({
        target_type: type,
        target_id: VALID_UUID,
        content: "感想",
      });
      const result = await createMemo({}, fd);
      expect(result).toEqual({});
    }
    expect(insertMock).toHaveBeenCalledTimes(types.length);
    expect(insertMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target_type: "topic",
        target_id: VALID_UUID,
        content: "感想",
      })
    );
  });

  it("挿入失敗時はエラーメッセージを返す", async () => {
    const insertMock = vi
      .fn()
      .mockResolvedValue({ error: { message: "boom" } });
    supabaseMock.from.mockReturnValue({ insert: insertMock });

    const fd = buildFormData({
      target_type: "video",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await createMemo({}, fd);
    expect(result.error).toMatch(/感想の登録に失敗しました: boom/);
  });
});

describe("updateMemo", () => {
  it("IDがUUID形式でない場合はエラーを返す", async () => {
    const fd = buildFormData({
      id: "invalid",
      target_type: "video",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await updateMemo({}, fd);
    expect(result.error).toBe("感想IDが不正です");
  });

  it("target_type が不正な場合はエラーを返す", async () => {
    const fd = buildFormData({
      id: VALID_UUID,
      target_type: "unknown",
      target_id: VALID_UUID,
      content: "感想",
    });
    const result = await updateMemo({}, fd);
    expect(result.error).toBe("対象種別が不正です");
  });

  it("target_id が不正な場合はエラーを返す", async () => {
    const fd = buildFormData({
      id: VALID_UUID,
      target_type: "video",
      target_id: "invalid",
      content: "感想",
    });
    const result = await updateMemo({}, fd);
    expect(result.error).toBe("対象IDが不正です");
  });

  it("contentが空の場合はエラーを返す", async () => {
    const fd = buildFormData({
      id: VALID_UUID,
      target_type: "video",
      target_id: VALID_UUID,
      content: "",
    });
    const result = await updateMemo({}, fd);
    expect(result.fieldError).toBe("感想を入力してください");
  });
});

describe("deleteMemo", () => {
  it("IDがUUID形式でない場合は例外を投げる", async () => {
    const fd = buildFormData({ id: "invalid" });
    await expect(deleteMemo(fd)).rejects.toThrow("感想IDが不正です");
  });

  it("認証されていない場合は例外を投げる", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    const fd = buildFormData({ id: VALID_UUID });
    await expect(deleteMemo(fd)).rejects.toThrow("認証が必要です");
  });
});
