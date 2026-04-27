import Link from "next/link";
import type { CastEntry, CastType } from "@/lib/types";

const PERFORMER_PATH: Record<CastType, string> = {
  artist: "/artists",
  comedy_group: "/combos",
  unit: "/units",
};

export function PerformerTag({ performer }: { performer: CastEntry }) {
  return (
    <Link
      href={`${PERFORMER_PATH[performer.type]}/${performer.id}`}
      className="inline-flex items-center rounded-full border border-brand-border-dark bg-brand-bg-dark px-2 py-0.5 text-xs text-brand-gold transition hover:border-brand-sky-light hover:text-brand-sky-light"
    >
      {performer.name}
    </Link>
  );
}

export function PerformerTagList({ performers }: { performers: CastEntry[] }) {
  if (performers.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {performers.map((performer) => (
        <li key={`${performer.type}-${performer.id}`}>
          <PerformerTag performer={performer} />
        </li>
      ))}
    </ul>
  );
}
