import type { CastEntry } from "@/lib/types";

export type CastRow = {
  artist_id: string | null;
  comedy_group_id: string | null;
  unit_id: string | null;
  artist: { id: string; name: string } | null;
  comedy_group: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
};

export function mapCasts(rows: CastRow[] | null | undefined): CastEntry[] {
  return (rows ?? []).flatMap((c) => {
    if (c.artist_id && c.artist) {
      return [{ type: "artist" as const, id: c.artist.id, name: c.artist.name }];
    }
    if (c.comedy_group_id && c.comedy_group) {
      return [{ type: "comedy_group" as const, id: c.comedy_group.id, name: c.comedy_group.name }];
    }
    if (c.unit_id && c.unit) {
      return [{ type: "unit" as const, id: c.unit.id, name: c.unit.name }];
    }
    return [];
  });
}
