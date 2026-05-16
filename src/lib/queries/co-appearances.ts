import { createClient } from "@/lib/supabase/server";
import type { CastEntry, ContentType } from "@/lib/types";
import {
  getDondecorteComedyGroupId,
  listCastsForContents,
  listDondecorteContents,
  entryFromRow,
} from "./_co-casts";

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

type Accumulator = Map<
  string,
  {
    performer: CastEntry;
    contentKeys: Set<string>;
    breakdown: CoAppearanceBreakdown;
    breakdownKeys: Record<ContentType, Set<string>>;
  }
>;

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

  const ownContents = await listDondecorteContents(supabase, dondecorteId);
  const totalContentCount = ownContents.length;

  const rows = await listCastsForContents(supabase, ownContents);

  const acc: Accumulator = new Map();

  for (const row of rows) {
    if (row.comedy_group_id === dondecorteId) continue;
    const performer = entryFromRow(row);
    if (!performer) continue;
    accumulate(acc, performer, row.content_type, row.content_id);
  }

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
