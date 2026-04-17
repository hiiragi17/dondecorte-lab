"use client";

import type { CastType } from "@/lib/types";

const TABS: { type: CastType; label: string }[] = [
  { type: "comedy_group", label: "コンビ" },
  { type: "artist", label: "芸人" },
  { type: "unit", label: "ユニット" },
];

type Props = {
  active: CastType;
  onChange: (type: CastType) => void;
};

export function CastTab({ active, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.type}
          type="button"
          onClick={() => onChange(tab.type)}
          className={
            active === tab.type
              ? "rounded-md bg-brand-sky px-3 py-1 text-xs font-medium text-brand-cream"
              : "rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
