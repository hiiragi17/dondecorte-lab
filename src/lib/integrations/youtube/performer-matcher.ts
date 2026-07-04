import type { CastEntry, CastType } from "@/lib/types";

// 照合に使う出演者候補。name は表示用の正式名、aliases は かな名など別表記。
export type PerformerCandidate = {
  type: CastType;
  id: string;
  name: string;
  aliases?: (string | null | undefined)[];
};

// 照合時に無視する最小文字数。1文字の名前は誤検出（部分一致）を招くため除外する。
const MIN_MATCH_LENGTH = 2;

// 全角/半角・大小・区切り記号（中黒・スラッシュ・空白・記号）の揺れを吸収して
// 「小橋 共作」「小橋・共作」「小橋共作」を同一視できるよう正規化する。
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[\s　・･/／\\|｜,、.。＆&"'’`~〜\-—–_（）()【】\[\]「」『』!！?？:：;；]/g,
      ""
    );
}

// 1候補が持つ正式名・別表記のうち、正規化後に最小長を満たす表記だけを照合キーにする。
function candidateKeys(candidate: PerformerCandidate): string[] {
  const raw = [candidate.name, ...(candidate.aliases ?? [])];
  const keys = new Set<string>();
  for (const value of raw) {
    if (!value) continue;
    const normalized = normalizeForMatch(value);
    if (normalized.length >= MIN_MATCH_LENGTH) {
      keys.add(normalized);
    }
  }
  return [...keys];
}

/**
 * 動画タイトル等のテキストから、候補一覧に含まれる出演者を推定する。
 * 正規化済みテキストに候補の表記（正式名 or 別表記）が部分一致すれば採用。
 * 同一候補は type:id で重複排除し、候補一覧の順序を保って返す。
 */
export function matchPerformers(
  text: string,
  candidates: PerformerCandidate[]
): CastEntry[] {
  const haystack = normalizeForMatch(text);
  if (haystack.length === 0) return [];

  const matched: CastEntry[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const key = `${candidate.type}:${candidate.id}`;
    if (seen.has(key)) continue;

    const hit = candidateKeys(candidate).some((needle) =>
      haystack.includes(needle)
    );
    if (!hit) continue;

    seen.add(key);
    matched.push({
      type: candidate.type as CastType,
      id: candidate.id,
      name: candidate.name,
    });
  }

  return matched;
}
