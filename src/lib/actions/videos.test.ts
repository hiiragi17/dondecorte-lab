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

import { createVideo, updateVideo, deleteVideo } from "./videos";

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

describe("createVideo", () => {
  it("タイトルが空ならエラーを返す", async () => {
    const fd = buildFormData({ title: "" });
    const result = await createVideo({}, fd);
    expect(result.fieldErrors?.title).toBe("タイトルを入力してください");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("タイトルが200文字を超えるとエラーを返す", async () => {
    const fd = buildFormData({ title: "あ".repeat(201) });
    const result = await createVideo({}, fd);
    expect(result.fieldErrors?.title).toBe("200文字以内で入力してください");
  });

  it("youtube_video_id の形式が不正だとエラーを返す", async () => {
    const fd = buildFormData({
      title: "テスト動画",
      youtube_video_id: "invalid",
    });
    const result = await createVideo({}, fd);
    expect(result.fieldErrors?.youtube_video_id).toBe(
      "YouTube動画IDの形式が不正です（11文字の英数字）"
    );
  });

  it("youtube_video_id が11文字の英数字なら受理する（redirectまで進む）", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({
      title: "テスト",
      youtube_video_id: "abcDEF12345",
    });

    await expect(createVideo({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "video",
        p_content_id: null,
        p_content: expect.objectContaining({ youtube_video_id: "abcDEF12345" }),
      })
    );
  });

  it("youtube_url から動画IDを抽出する", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({
      title: "テスト",
      youtube_url: "https://youtu.be/abcDEF12345",
    });

    await expect(createVideo({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "video",
        p_content_id: null,
        p_content: expect.objectContaining({ youtube_video_id: "abcDEF12345" }),
      })
    );
  });

  it("認証されていない場合はエラーを返す", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    const fd = buildFormData({ title: "テスト" });
    const result = await createVideo({}, fd);
    expect(result.error).toBe("認証が必要です");
  });

  it("出演者の種別が不正な場合はエラーを返す", async () => {
    const fd = buildFormData({
      title: "テスト",
      cast_type: ["invalid"],
      cast_id: ["11111111-1111-4111-8111-111111111111"],
      cast_name: ["X"],
    });
    const result = await createVideo({}, fd);
    expect(result.fieldErrors?.casts).toBe("出演者の種別が不正です");
  });

  it("同じ出演者を複数回指定するとエラーを返す", async () => {
    const fd = buildFormData({
      title: "テスト",
      cast_type: ["artist", "artist"],
      cast_id: ["aaaa", "aaaa"],
      cast_name: ["A", "A"],
    });
    const result = await createVideo({}, fd);
    expect(result.fieldErrors?.casts).toBe("同じ出演者を複数回追加できません");
  });
});

describe("updateVideo", () => {
  it("IDがUUID形式でない場合はエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト" });
    const result = await updateVideo("not-a-uuid", {}, fd);
    expect(result.error).toBe("IDが不正です");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("バリデーションエラーを返す", async () => {
    const fd = buildFormData({ title: "" });
    const result = await updateVideo(
      "11111111-1111-4111-8111-111111111111",
      {},
      fd
    );
    expect(result.fieldErrors?.title).toBeDefined();
  });

  it("RPC を呼び出して更新する（redirectまで進む）", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({ title: "更新後タイトル" });
    await expect(
      updateVideo("11111111-1111-4111-8111-111111111111", {}, fd)
    ).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "video",
        p_content_id: "11111111-1111-4111-8111-111111111111",
      })
    );
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("RPC が not found を返した場合は既存メッセージを返す", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0002", message: "not found" },
    });

    const fd = buildFormData({ title: "テスト" });
    const result = await updateVideo(
      "11111111-1111-4111-8111-111111111111",
      {},
      fd
    );
    expect(result.error).toBe("指定された動画が見つかりません");
  });
});

describe("deleteVideo", () => {
  it("IDが空なら何もせず終了する", async () => {
    const fd = buildFormData({ id: "" });
    await expect(deleteVideo(fd)).resolves.toBeUndefined();
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("IDがUUID形式でない場合は例外を投げる", async () => {
    const fd = buildFormData({ id: "not-a-uuid" });
    await expect(deleteVideo(fd)).rejects.toThrow("IDが不正です");
  });
});
