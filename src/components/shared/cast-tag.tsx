import Link from "next/link";
import type { CastEntry, CastType } from "@/lib/types";

const CAST_PATH: Record<CastType, string> = {
  artist: "/artists",
  comedy_group: "/combos",
  unit: "/units",
};

export function CastTag({ cast }: { cast: CastEntry }) {
  return (
    <Link
      href={`${CAST_PATH[cast.type]}/${cast.id}`}
      className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-bg-dark px-2 py-0.5 text-xs text-brand-gold transition hover:border-brand-sky-light hover:text-brand-sky-light"
    >
      {cast.name}
    </Link>
  );
}

export function CastTagList({ casts }: { casts: CastEntry[] }) {
  if (casts.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {casts.map((cast) => (
        <li key={`${cast.type}-${cast.id}`}>
          <CastTag cast={cast} />
        </li>
      ))}
    </ul>
  );
}
