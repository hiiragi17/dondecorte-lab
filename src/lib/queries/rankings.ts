import { mapCasts, type CastRow } from "@/lib/queries/_casts";
import { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

const CAST_TABLE_BY_CONTENT = {
  video: "video_casts",
  live: "live_casts",
  radio: "radio_casts",
  article: "article_casts",
  tv_show: "tv_show_casts",
  topic: "topic_casts",
} as const satisfies Record<ContentType, string>;

const CONTENT_TYPES = Object.keys(CAST_TABLE_BY_CONTENT) as ContentType[];

type CastTable = (typeof CAST_TABLE_BY_CONTENT)[ContentType];
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const CAST_SUBSELECT = `
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

export type AppearanceRankingEntry = {
  performer: CastEntry;
  counts: Record<ContentType, number>;
  total: number;
};

function emptyCounts(): Record<ContentType, number> {
  return { video: 0, live: 0, radio: 0, article: 0, tv_show: 0, topic: 0 };
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
  supabase: SupabaseClient,
  table: CastTable
): Promise<CastRow[]> {
  const rows: CastRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(CAST_SUBSELECT)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `出演回数ランキングの取得に失敗しました: ${error.message}`
      );
    }

    const page = (data ?? []) as unknown as CastRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function listAppearanceRanking(): Promise<
  AppearanceRankingEntry[]
> {
  const supabase = await createClient();

  const castRowsByContentType = await Promise.all(
    CONTENT_TYPES.map((contentType) =>
      selectAllCastRows(supabase, CAST_TABLE_BY_CONTENT[contentType])
    )
  );

  const castsByContentType = {} as Record<ContentType, CastEntry[]>;
  CONTENT_TYPES.forEach((contentType, index) => {
    castsByContentType[contentType] = mapCasts(castRowsByContentType[index]);
  });

  return aggregateAppearanceRanking(castsByContentType);
}
