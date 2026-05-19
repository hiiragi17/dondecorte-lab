import { describe, expect, it, vi, beforeEach } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

import { deleteContent } from "./content-service";

function mockDeleteResult(result: {
  error: { message: string } | null;
  count: number | null;
}) {
  const eq = vi.fn(async () => result);
  const del = vi.fn(() => ({ eq }));
  supabaseMock.from.mockReturnValue({ delete: del });
  return { del, eq };
}

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  supabaseMock.from.mockReset();
});

describe("deleteContent", () => {
  it("未認証なら例外を投げる", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(
      deleteContent({ contentType: "video", id: "v1" })
    ).rejects.toThrow("認証が必要です");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("削除件数が1なら正常終了する", async () => {
    const { del, eq } = mockDeleteResult({ error: null, count: 1 });
    await expect(
      deleteContent({ contentType: "video", id: "v1" })
    ).resolves.toBeUndefined();
    expect(supabaseMock.from).toHaveBeenCalledWith("videos");
    expect(del).toHaveBeenCalledWith({ count: "exact" });
    expect(eq).toHaveBeenCalledWith("id", "v1");
  });

  it("対象が存在しない（件数0）場合は例外を投げる", async () => {
    mockDeleteResult({ error: null, count: 0 });
    await expect(
      deleteContent({ contentType: "live", id: "l1" })
    ).rejects.toThrow("指定されたライブが見つかりません");
  });

  it("削除でエラーが返った場合は整形したメッセージで例外を投げる", async () => {
    mockDeleteResult({ error: { message: "boom" }, count: null });
    await expect(
      deleteContent({ contentType: "article", id: "a1" })
    ).rejects.toThrow("記事の削除に失敗しました: boom");
  });
});
