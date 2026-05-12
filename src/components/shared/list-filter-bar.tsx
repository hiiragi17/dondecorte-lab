"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { PerformerOptions } from "@/lib/queries/performers";

type Props = {
  performers: PerformerOptions;
};

export function ListFilterBar({ performers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const performer = searchParams.get("performer") ?? "";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-lg border border-brand-border-dark bg-brand-card-dark p-3 sm:flex-row sm:items-center sm:gap-3 md:mb-6"
      aria-busy={isPending}
    >
      <label className="flex items-center gap-2 text-xs text-brand-gold sm:text-sm">
        <span className="shrink-0">並び替え</span>
        <select
          value={sort}
          onChange={(e) =>
            updateParam("sort", e.target.value === "oldest" ? "oldest" : null)
          }
          className="block w-full min-w-0 rounded-md border border-brand-border-dark bg-brand-bg-dark px-2 py-1.5 text-sm text-brand-cream focus:border-brand-sky-light focus:outline-none focus:ring-1 focus:ring-brand-sky-light sm:w-auto"
        >
          <option value="newest">新着順</option>
          <option value="oldest">古い順</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-brand-gold sm:text-sm">
        <span className="shrink-0">出演者</span>
        <select
          value={performer}
          onChange={(e) => updateParam("performer", e.target.value || null)}
          className="block w-full min-w-0 rounded-md border border-brand-border-dark bg-brand-bg-dark px-2 py-1.5 text-sm text-brand-cream focus:border-brand-sky-light focus:outline-none focus:ring-1 focus:ring-brand-sky-light sm:w-64"
        >
          <option value="">すべて</option>
          {performers.combos.length > 0 ? (
            <optgroup label="コンビ">
              {performers.combos.map((p) => (
                <option key={`combo-${p.id}`} value={`comedy_group:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {performers.artists.length > 0 ? (
            <optgroup label="芸人">
              {performers.artists.map((p) => (
                <option key={`artist-${p.id}`} value={`artist:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {performers.units.length > 0 ? (
            <optgroup label="ユニット">
              {performers.units.map((p) => (
                <option key={`unit-${p.id}`} value={`unit:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </label>
    </div>
  );
}
