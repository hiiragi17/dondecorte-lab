import Link from "next/link";
import type { CastEntry, CastType } from "@/lib/types";

const PERFORMER_PATH: Record<CastType, string> = {
  artist: "/artists",
  comedy_group: "/combos",
  unit: "/units",
};

export function PerformerTag({ performer }: { performer: CastEntry }) {
  const isCombo = performer.type === "comedy_group";
  const className = isCombo
    ? "inline-flex items-center rounded-full bg-brand-sky-light px-2 py-0.5 text-xs font-medium text-brand-bg-dark transition-colors duration-150 hover:bg-brand-sky-hover"
    : "inline-flex items-center rounded-full border border-brand-border-dark bg-brand-brown px-2 py-0.5 text-xs text-brand-cream transition-colors duration-150 hover:border-brand-sky-light hover:text-brand-sky-light";

  return (
    <Link
      href={`${PERFORMER_PATH[performer.type]}/${performer.id}`}
      className={className}
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
