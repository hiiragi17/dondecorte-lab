import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";

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

import {
  createVideo,
  updateVideo,
  deleteVideo,
  approveVideo,
  rejectVideo,
} from "./videos";

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

describe("approveVideo / rejectVideo", () => {
  const VIDEO_ID = "11111111-1111-4111-8111-111111111111";

  function setupUpdate(
    result: { error?: { message: string } | null; count?: number } = {}
  ) {
    const eqMock = vi.fn().mockResolvedValue({
      error: result.error ?? null,
      count: result.count ?? 1,
    });
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    supabaseMock.from.mockReturnValue({ update: updateMock });
    return { updateMock, eqMock };
  }

  it("IDが空なら何もせず終了する", async () => {
    const fd = buildFormData({ id: "" });
    await expect(approveVideo(fd)).resolves.toBeUndefined();
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("IDがUUID形式でない場合は例外を投げる", async () => {
    const fd = buildFormData({ id: "not-a-uuid" });
    await expect(approveVideo(fd)).rejects.toThrow("IDが不正です");
  });

  it("未認証なら例外を投げる", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    setupUpdate();
    const fd = buildFormData({ id: VIDEO_ID });
    await expect(approveVideo(fd)).rejects.toThrow("認証が必要です");
  });

  it("承認すると review_status を approved に更新する", async () => {
    const { updateMock, eqMock } = setupUpdate();
    const fd = buildFormData({ id: VIDEO_ID });

    await approveVideo(fd);

    expect(supabaseMock.from).toHaveBeenCalledWith("videos");
    expect(updateMock).toHaveBeenCalledWith(
      { review_status: "approved" },
      { count: "exact" }
    );
    expect(eqMock).toHaveBeenCalledWith("id", VIDEO_ID);
    // 承認は公開側の表示対象を変えるため、動画を表示する主要ページを再検証すること
    expect(vi.mocked(revalidatePath).mock.calls.map((call) => call[0])).toEqual([
      "/admin/videos",
      "/admin/videos/review",
      "/videos",
      "/timeline",
      "/",
    ]);
  });

  it("却下すると review_status を rejected に更新する", async () => {
    const { updateMock } = setupUpdate();
    const fd = buildFormData({ id: VIDEO_ID });

    await rejectVideo(fd);

    expect(updateMock).toHaveBeenCalledWith(
      { review_status: "rejected" },
      { count: "exact" }
    );
  });

  it("更新に失敗したら例外を投げる", async () => {
    setupUpdate({ error: { message: "update boom" } });
    const fd = buildFormData({ id: VIDEO_ID });
    await expect(approveVideo(fd)).rejects.toThrow(
      "動画のレビュー状態の更新に失敗しました: update boom"
    );
  });

  it("対象が存在しなければ例外を投げる", async () => {
    setupUpdate({ count: 0 });
    const fd = buildFormData({ id: VIDEO_ID });
    await expect(approveVideo(fd)).rejects.toThrow(
      "指定された動画が見つかりません"
    );
  });
});
