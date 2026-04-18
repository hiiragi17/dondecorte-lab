"use client";

import type { CastEntry, CastType } from "@/lib/types";

const TYPE_LABELS: Record<CastType, string> = {
  artist: "個人",
  comedy_group: "コンビ",
  unit: "ユニット",
};

type Props = {
  entries: CastEntry[];
  onRemove: (entry: CastEntry) => void;
};

export function CastTagList({ entries, onRemove }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-brand-brown-light">
        出演者がまだ選択されていません。
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <li
          key={`${entry.type}:${entry.id}`}
          className="flex items-center gap-1 rounded-full border border-brand-border-light bg-brand-bg-light px-3 py-1 text-xs text-brand-brown-dark"
        >
          <span className="text-brand-brown-light">
            {TYPE_LABELS[entry.type]}
          </span>
          <span className="font-medium">{entry.name}</span>
          <button
            type="button"
            aria-label={`${entry.name} を解除`}
            onClick={() => onRemove(entry)}
            className="ml-1 rounded-full text-brand-brown-light transition hover:text-brand-sky"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
