import { createClient } from "@/lib/supabase/server";
import type { CastEntry } from "@/lib/types";
import {
  entryFromRow,
  getDondecorteComedyGroupId,
  listCastsForContents,
  listDondecorteContents,
} from "./_co-casts";

export type CoAppearanceGraphNode = {
  id: string;
  performer: CastEntry;
  count: number;
  isCenter: boolean;
};

export type CoAppearanceGraphLink = {
  source: string;
  target: string;
  weight: number;
};

export type CoAppearanceGraph = {
  nodes: CoAppearanceGraphNode[];
  links: CoAppearanceGraphLink[];
  totalContentCount: number;
  found: boolean;
};

const EMPTY_GRAPH: CoAppearanceGraph = {
  nodes: [],
  links: [],
  totalContentCount: 0,
  found: false,
};

function performerKey(performer: CastEntry): string {
  return `${performer.type}:${performer.id}`;
}

export async function getCoAppearanceGraph(): Promise<CoAppearanceGraph> {
  const supabase = await createClient();
  const dondecorteId = await getDondecorteComedyGroupId(supabase);
  if (!dondecorteId) return EMPTY_GRAPH;

  const dondecorteKey = `comedy_group:${dondecorteId}`;

  const ownContents = await listDondecorteContents(supabase, dondecorteId);
  const totalContentCount = ownContents.length;

  const rows = await listCastsForContents(supabase, ownContents);

  const performers = new Map<string, CastEntry>();
  const contentPerformers = new Map<string, Set<string>>();

  for (const row of rows) {
    const contentKey = `${row.content_type}:${row.content_id}`;

    const performer = entryFromRow(row);
    if (!performer) continue;

    const key = performerKey(performer);
    performers.set(key, performer);

    let members = contentPerformers.get(contentKey);
    if (!members) {
      members = new Set<string>();
      contentPerformers.set(contentKey, members);
    }
    members.add(key);
  }

  const nodeCounts = new Map<string, number>();
  const edgeWeights = new Map<string, number>();

  for (const members of contentPerformers.values()) {
    const keys = Array.from(members).sort();
    for (const key of keys) {
      nodeCounts.set(key, (nodeCounts.get(key) ?? 0) + 1);
    }
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const edgeKey = `${keys[i]}|${keys[j]}`;
        edgeWeights.set(edgeKey, (edgeWeights.get(edgeKey) ?? 0) + 1);
      }
    }
  }

  const nodes: CoAppearanceGraphNode[] = [];
  for (const [key, performer] of performers) {
    nodes.push({
      id: key,
      performer,
      count: nodeCounts.get(key) ?? 0,
      isCenter: key === dondecorteKey,
    });
  }
  nodes.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.performer.name.localeCompare(b.performer.name, "ja");
  });

  const links: CoAppearanceGraphLink[] = [];
  for (const [edgeKey, weight] of edgeWeights) {
    const [source, target] = edgeKey.split("|");
    links.push({ source, target, weight });
  }
  links.sort((a, b) => b.weight - a.weight);

  return {
    nodes,
    links,
    totalContentCount,
    found: true,
  };
}
