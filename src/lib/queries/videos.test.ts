import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CastEntry } from "@/lib/types";

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

// casts の取得ロジックは _casts 側でテストするため、ここではモックする
const fetchCastsByContentMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/queries/_casts", () => ({
  fetchCastsByContent: fetchCastsByContentMock,
}));

import { listVideosForReview } from "./videos";

type VideoRow = { id: string; review_status: string };

// select("*").neq(...).order(...).order(...) のチェーンをモックする
function setupSelect(options: {
  rows?: VideoRow[];
  error?: { message: string } | null;
}) {
  const secondOrderMock = vi.fn().mockResolvedValue({
    data: options.rows ?? [],
    error: options.error ?? null,
  });
  const firstOrderMock = vi.fn(() => ({ order: secondOrderMock }));
  const neqMock = vi.fn(() => ({ order: firstOrderMock }));
  const selectMock = vi.fn(() => ({ neq: neqMock }));
  supabaseMock.from.mockReturnValue({ select: selectMock });
  return { neqMock };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchCastsByContentMock.mockResolvedValue(new Map());
});

describe("listVideosForReview", () => {
  it("対象が0件なら casts を取得せず空の結果を返す", async () => {
    setupSelect({ rows: [] });

    const result = await listVideosForReview();

    expect(result).toEqual({ pending: [], rejected: [] });
    expect(fetchCastsByContentMock).not.toHaveBeenCalled();
  });

  it("承認待ちと却下済みに振り分け、casts を付与する", async () => {
    const { neqMock } = setupSelect({
      rows: [
        { id: "v1", review_status: "pending" },
        { id: "v2", review_status: "rejected" },
        { id: "v3", review_status: "pending" },
      ],
    });
    const casts: CastEntry[] = [
      { type: "comedy_group", id: "g1", name: "ドンデコルテ" },
    ];
    fetchCastsByContentMock.mockResolvedValue(new Map([["v1", casts]]));

    const result = await listVideosForReview();

    // 承認済みはクエリ側で除外されている（neq で絞り込むこと）
    expect(neqMock).toHaveBeenCalledWith("review_status", "approved");
    expect(result.pending.map((v) => v.id)).toEqual(["v1", "v3"]);
    expect(result.rejected.map((v) => v.id)).toEqual(["v2"]);
    expect(result.pending[0].casts).toEqual(casts);
    expect(result.pending[1].casts).toEqual([]);
  });

  it("取得に失敗したら例外を投げる", async () => {
    setupSelect({ error: { message: "select boom" } });

    await expect(listVideosForReview()).rejects.toThrow(
      "レビュー対象動画の取得に失敗しました: select boom"
    );
  });
});
