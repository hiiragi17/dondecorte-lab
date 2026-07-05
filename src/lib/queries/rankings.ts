import {
  fetchApprovedVideoIds,
  isVisibleContent,
} from "@/lib/queries/_approved-videos";
import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_TYPES, type CastEntry, type ContentType } from "@/lib/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const CAST_SELECT = `
  content_type,
  content_id,
  artist_id,
  comedy_group_id,
  unit_id,
  artist:artists(id, name),
  comedy_group:comedy_groups(id, name),
  unit:units(id, name)
`;

// PostgREST は 1 リクエストあたりの返却行数に上限があるため、
// 全行を range で分割取得して集計漏れを防ぐ。
const PAGE_SIZE = 1000;

type CastWithTypeRow = CastRow & {
  content_type: ContentType;
  content_id: string;
};

export type AppearanceRankingEntry = {
  performer: CastEntry;
  counts: Record<ContentType, number>;
  total: number;
};

function emptyCounts(): Record<ContentType, number> {
  return {
    video: 0,
    live: 0,
    radio: 0,
    article: 0,
    tv_show: 0,
    topic: 0,
    cm: 0,
    magazine: 0,
  };
}

export function aggregateAppearanceRanking(
  castsByContentType: Record<ContentType, CastEntry[]>
): AppearanceRankingEntry[] {
  const entries = new Map<string, AppearanceRankingEntry>();

  for (const contentType of CONTENT_TYPES) {
    for (const cast of castsByContentType[contentType]) {
      const key = `${cast.type}:${cast.id}`;
      let entry = entries.get(key);
      if (!entry) {
        entry = { performer: cast, counts: emptyCounts(), total: 0 };
        entries.set(key, entry);
      }
      entry.counts[contentType] += 1;
      entry.total += 1;
    }
  }

  return [...entries.values()].sort(
    (a, b) =>
      b.total - a.total ||
      a.performer.name.localeCompare(b.performer.name, "ja")
  );
}

async function selectAllCastRows(
  supabase: SupabaseClient
): Promise<CastWithTypeRow[]> {
  const rows: CastWithTypeRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("casts")
      .select(CAST_SELECT)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `出演回数ランキングの取得に失敗しました: ${error.message}`
      );
    }

    // Supabase は埋め込みリレーションを配列型として推論するため、
    // CastWithTypeRow[] への単一キャストでは型エラーになる（実行時の形状は一致する）。
    const page = (data ?? []) as unknown as CastWithTypeRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function listAppearanceRanking(): Promise<
  AppearanceRankingEntry[]
> {
  const supabase = await createClient();
  // 承認前・却下済み動画の casts 行が公開ランキングに混入しないよう、
  // 承認済み動画の ID 集合で video 行を絞り込む
  const [rows, approvedVideoIds] = await Promise.all([
    selectAllCastRows(supabase),
    fetchApprovedVideoIds(supabase),
  ]);

  const castsByContentType: Record<ContentType, CastEntry[]> = {
    video: [],
    live: [],
    radio: [],
    article: [],
    tv_show: [],
    topic: [],
    cm: [],
    magazine: [],
  };

  for (const row of rows) {
    if (!isVisibleContent(row.content_type, row.content_id, approvedVideoIds)) {
      continue;
    }
    const [entry] = mapCasts([row]);
    if (entry) castsByContentType[row.content_type].push(entry);
  }

  return aggregateAppearanceRanking(castsByContentType);
}
