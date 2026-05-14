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

  it("バリデーション通過時は records を挿入して redirect する", async () => {
    const insertSelectSingle = vi.fn().mockResolvedValue({
      data: { id: "11111111-1111-4111-8111-111111111111" },
      error: null,
    });
    const insertSelect = vi.fn(() => ({ single: insertSelectSingle }));
    const insertChain = vi.fn(() => ({ select: insertSelect }));
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteChain = vi.fn(() => ({ eq: deleteEq }));

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "articles") return { insert: insertChain };
      if (table === "article_casts") return { delete: deleteChain };
      throw new Error(`unexpected table: ${table}`);
    });

    const fd = buildFormData({
      title: "テスト",
      url: "https://example.com/article",
      content: "短い要約",
    });
    await expect(createArticle({}, fd)).rejects.toThrow(/__REDIRECT__/);
    expect(insertChain).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "テスト",
        url: "https://example.com/article",
        content: "短い要約",
      })
    );
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
