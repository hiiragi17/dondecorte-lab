import { listArtistSummaries } from "@/lib/queries/artists";
import { listComboSummaries } from "@/lib/queries/combos";
import { listUnitSummaries } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";

export type PerformerOptions = {
  combos: CastEntry[];
  artists: CastEntry[];
  units: CastEntry[];
};

export async function listAllPerformers(): Promise<PerformerOptions> {
  const [artists, combos, units] = await Promise.all([
    listArtistSummaries(),
    listComboSummaries(),
    listUnitSummaries(),
  ]);

  return {
    combos: combos.map((c) => ({
      type: "comedy_group" as const,
      id: c.id,
      name: c.name,
    })),
    artists: artists.map((a) => ({
      type: "artist" as const,
      id: a.id,
      name: a.name,
    })),
    units: units.map((u) => ({ type: "unit" as const, id: u.id, name: u.name })),
  };
}
