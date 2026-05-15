import { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";

const DONDECORTE_COMBO_NAME = "ドンデコルテ";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CastTable =
  | "video_casts"
  | "live_casts"
  | "radio_casts"
  | "article_casts"
  | "tv_show_casts"
  | "topic_casts";

type ParentIdField =
  | "video_id"
  | "live_id"
  | "radio_id"
  | "article_id"
  | "tv_show_id"
  | "topic_id";

type CastTableSpec = {
  table: CastTable;
  parentIdField: ParentIdField;
  contentType: ContentType;
};

const CAST_TABLES: CastTableSpec[] = [
  { table: "video_casts", parentIdField: "video_id", contentType: "video" },
  { table: "live_casts", parentIdField: "live_id", contentType: "live" },
  { table: "radio_casts", parentIdField: "radio_id", contentType: "radio" },
  {
    table: "article_casts",
    parentIdField: "article_id",
    contentType: "article",
  },
  {
    table: "tv_show_casts",
    parentIdField: "tv_show_id",
    contentType: "tv_show",
  },
  { table: "topic_casts", parentIdField: "topic_id", contentType: "topic" },
];

export type CoAppearanceBreakdown = Record<ContentType, number>;

export type CoAppearanceEntry = {
  performer: CastEntry;
  count: number;
  breakdown: CoAppearanceBreakdown;
};

export type CoAppearanceRanking = {
  combos: CoAppearanceEntry[];
  artists: CoAppearanceEntry[];
  units: CoAppearanceEntry[];
  totalContentCount: number;
  found: boolean;
};

const EMPTY_RANKING: CoAppearanceRanking = {
  combos: [],
  artists: [],
  units: [],
  totalContentCount: 0,
  found: false,
};

function emptyBreakdown(): CoAppearanceBreakdown {
  return {
    video: 0,
    live: 0,
    radio: 0,
    article: 0,
    tv_show: 0,
    topic: 0,
  };
}

async function getDondecorteComedyGroupId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("comedy_groups")
    .select("id")
    .eq("name", DONDECORTE_COMBO_NAME)
    .maybeSingle();

  if (error) {
    throw new Error(`コンビ情報の取得に失敗しました: ${error.message}`);
  }

  return (data?.id as string | undefined) ?? null;
}

type CoCastRow = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

type RawCoCastRow = CoCastRow & Record<ParentIdField, string>;

async function listOwnParentIds(
  supabase: SupabaseClient,
  spec: CastTableSpec,
  dondecorteId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(spec.table)
    .select(spec.parentIdField)
    .eq("comedy_group_id", dondecorteId);

  if (error) {
    throw new Error(
      `共演者情報の取得に失敗しました(${spec.table}): ${error.message}`
    );
  }

  const ids = ((data ?? []) as Array<Record<ParentIdField, string>>).map(
    (row) => row[spec.parentIdField]
  );
  return Array.from(new Set(ids));
}

async function listCoCastRows(
  supabase: SupabaseClient,
  spec: CastTableSpec,
  parentIds: string[]
): Promise<RawCoCastRow[]> {
  if (parentIds.length === 0) return [];

  const { data, error } = await supabase
    .from(spec.table)
    .select(
      `${spec.parentIdField},
       artist_id,
       comedy_group_id,
       unit_id,
       artist:artists(id, name),
       comedy_group:comedy_groups(id, name),
       unit:units(id, name)`
    )
    .in(spec.parentIdField, parentIds);

  if (error) {
    throw new Error(
      `共演者情報の取得に失敗しました(${spec.table}): ${error.message}`
    );
  }

  return (data ?? []) as unknown as RawCoCastRow[];
}

type Accumulator = Map<
  string,
  {
    performer: CastEntry;
    contentKeys: Set<string>;
    breakdown: CoAppearanceBreakdown;
    breakdownKeys: Record<ContentType, Set<string>>;
  }
>;

function entryFromRow(row: CoCastRow): CastEntry | null {
  if (row.artist_id && row.artist) {
    return { type: "artist", id: row.artist.id, name: row.artist.name };
  }
  if (row.comedy_group_id && row.comedy_group) {
    return {
      type: "comedy_group",
      id: row.comedy_group.id,
      name: row.comedy_group.name,
    };
  }
  if (row.unit_id && row.unit) {
    return { type: "unit", id: row.unit.id, name: row.unit.name };
  }
  return null;
}

function accumulate(
  acc: Accumulator,
  performer: CastEntry,
  contentType: ContentType,
  parentId: string
) {
  const key = `${performer.type}:${performer.id}`;
  let entry = acc.get(key);
  if (!entry) {
    entry = {
      performer,
      contentKeys: new Set<string>(),
      breakdown: emptyBreakdown(),
      breakdownKeys: {
        video: new Set<string>(),
        live: new Set<string>(),
        radio: new Set<string>(),
        article: new Set<string>(),
        tv_show: new Set<string>(),
        topic: new Set<string>(),
      },
    };
    acc.set(key, entry);
  }

  const contentKey = `${contentType}:${parentId}`;
  entry.contentKeys.add(contentKey);

  const perTypeKeys = entry.breakdownKeys[contentType];
  if (!perTypeKeys.has(parentId)) {
    perTypeKeys.add(parentId);
    entry.breakdown[contentType] += 1;
  }
}

function sortEntries(entries: CoAppearanceEntry[]): CoAppearanceEntry[] {
  return entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.performer.name.localeCompare(b.performer.name, "ja");
  });
}

export async function getCoAppearanceRanking(): Promise<CoAppearanceRanking> {
  const supabase = await createClient();
  const dondecorteId = await getDondecorteComedyGroupId(supabase);

  if (!dondecorteId) return EMPTY_RANKING;

  const ownParentIdsPerTable = await Promise.all(
    CAST_TABLES.map((spec) => listOwnParentIds(supabase, spec, dondecorteId))
  );

  const totalContentCount = ownParentIdsPerTable.reduce(
    (sum, ids) => sum + ids.length,
    0
  );

  const coCastRowsPerTable = await Promise.all(
    CAST_TABLES.map((spec, index) =>
      listCoCastRows(supabase, spec, ownParentIdsPerTable[index])
    )
  );

  const acc: Accumulator = new Map();

  CAST_TABLES.forEach((spec, index) => {
    const rows = coCastRowsPerTable[index];
    for (const row of rows) {
      if (row.comedy_group_id === dondecorteId) continue;
      const performer = entryFromRow(row);
      if (!performer) continue;
      const parentId = row[spec.parentIdField];
      accumulate(acc, performer, spec.contentType, parentId);
    }
  });

  const combos: CoAppearanceEntry[] = [];
  const artists: CoAppearanceEntry[] = [];
  const units: CoAppearanceEntry[] = [];

  for (const entry of acc.values()) {
    const result: CoAppearanceEntry = {
      performer: entry.performer,
      count: entry.contentKeys.size,
      breakdown: entry.breakdown,
    };
    if (entry.performer.type === "comedy_group") combos.push(result);
    else if (entry.performer.type === "artist") artists.push(result);
    else units.push(result);
  }

  return {
    combos: sortEntries(combos),
    artists: sortEntries(artists),
    units: sortEntries(units),
    totalContentCount,
    found: true,
  };
}
