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

import { createArticle, updateArticle, deleteArticle } from "./articles";

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

describe("createArticle", () => {
  it("タイトルが空ならエラーを返す", async () => {
    const fd = buildFormData({ title: "", url: "https://example.com" });
    const result = await createArticle({}, fd);
    expect(result.fieldErrors?.title).toBe("タイトルを入力してください");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("URLが空の場合はエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト記事", url: "" });
    const result = await createArticle({}, fd);
    expect(result.fieldErrors?.url).toBe("URLを入力してください");
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("URLの形式が不正な場合はエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト", url: "not-a-url" });
    const result = await createArticle({}, fd);
    expect(result.fieldErrors?.url).toBe(
      "URLの形式が不正です（http/https のみ）"
    );
  });

  it("ftp など http/https 以外のスキームは不正", async () => {
    const fd = buildFormData({
      title: "テスト",
      url: "ftp://example.com",
    });
    const result = await createArticle({}, fd);
    expect(result.fieldErrors?.url).toBeDefined();
  });

  it("contentが500文字を超える（本文転載相当）の場合はエラーを返す", async () => {
    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com",
      content: "あ".repeat(501),
    });
    const result = await createArticle({}, fd);
    expect(result.fieldErrors?.content).toMatch(/本文の転載は禁止/);
  });

  it("認証されていない場合はエラーを返す", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com",
    });
    const result = await createArticle({}, fd);
    expect(result.error).toBe("認証が必要です");
  });

  it("バリデーション通過時は RPC を呼び出して redirect する", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });

    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com/article",
      content: "短い要約",
      cast_type: ["artist"],
      cast_id: ["22222222-2222-4222-8222-222222222222"],
      cast_name: ["出演者A"],
    });
    await expect(createArticle({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "upsert_content_with_casts",
      expect.objectContaining({
        p_content_type: "article",
        p_content_id: null,
        p_content: expect.objectContaining({
          title: "テスト",
          url: "https://example.com/article",
          content: "短い要約",
        }),
        p_casts: [
          { type: "artist", id: "22222222-2222-4222-8222-222222222222" },
        ],
      })
    );
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});

describe("updateArticle", () => {
  it("IDがUUID形式でない場合はエラーを返す", async () => {
    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com",
    });
    const result = await updateArticle("invalid", {}, fd);
    expect(result.error).toBe("IDが不正です");
  });

  it("URL未指定の場合はバリデーションエラーを返す", async () => {
    const fd = buildFormData({ title: "テスト" });
    const result = await updateArticle(
      "11111111-1111-4111-8111-111111111111",
      {},
      fd
    );
    expect(result.fieldErrors?.url).toBeDefined();
  });

  it("RPC が not found を返した場合は既存メッセージを返す", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0002", message: "not found" },
    });

    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com",
    });
    const result = await updateArticle(
      "11111111-1111-4111-8111-111111111111",
      {},
      fd
    );
    expect(result.error).toBe("指定された記事が見つかりません");
  });
});

describe("deleteArticle", () => {
  it("IDが空なら何もせず終了する", async () => {
    const fd = buildFormData({ id: "" });
    await expect(deleteArticle(fd)).resolves.toBeUndefined();
  });

  it("IDがUUID形式でない場合は例外を投げる", async () => {
    const fd = buildFormData({ id: "not-a-uuid" });
    await expect(deleteArticle(fd)).rejects.toThrow("IDが不正です");
  });
});
