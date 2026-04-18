"use client";

import { useMemo, useState } from "react";
import { CastSearch } from "./cast-search";
import { CastTab } from "./cast-tab";
import { CastTagList } from "./cast-tag-list";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry, CastType } from "@/lib/types";

type Props = {
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  value: CastEntry[];
  onChange: (entries: CastEntry[]) => void;
};

export function CastSelector({
  artists,
  combos,
  units,
  value,
  onChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<CastType>("comedy_group");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => {
    const map = new Map<CastType, Set<string>>();
    for (const entry of value) {
      if (!map.has(entry.type)) map.set(entry.type, new Set());
      map.get(entry.type)!.add(entry.id);
    }
    return map;
  }, [value]);

  const currentItems: { id: string; name: string; kana_name?: string | null }[] =
    useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      const selected = selectedIds.get(activeTab) ?? new Set();

      const filter = (items: { id: string; name: string; kana_name?: string | null }[]) =>
        items
          .filter((item) => !selected.has(item.id))
          .filter((item) =>
            !query
              ? true
              : item.name.toLowerCase().includes(query) ||
                (item.kana_name ?? "").toLowerCase().includes(query)
          );

      if (activeTab === "comedy_group") return filter(combos);
      if (activeTab === "artist") return filter(artists);
      return filter(units);
    }, [activeTab, searchQuery, selectedIds, artists, combos, units]);

  const handleTabChange = (type: CastType) => {
    setActiveTab(type);
    setSearchQuery("");
    setSelectedId("");
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedId) {
      setError("追加する対象を選択してください");
      return;
    }

    const allItems =
      activeTab === "comedy_group"
        ? combos
        : activeTab === "artist"
          ? artists
          : units;

    const found = allItems.find((item) => item.id === selectedId);
    if (!found) {
      setError("選択した対象が見つかりません");
      return;
    }

    if (selectedIds.get(activeTab)?.has(found.id)) {
      setError("すでに追加されています");
      return;
    }

    onChange([...value, { type: activeTab, id: found.id, name: found.name }]);
    setSelectedId("");
    setSearchQuery("");
    setError(null);
  };

  const handleRemove = (entry: CastEntry) => {
    onChange(value.filter((e) => !(e.type === entry.type && e.id === entry.id)));
  };

  return (
    <div className="space-y-3">
      <CastTagList entries={value} onRemove={handleRemove} />

      <div className="space-y-3 rounded-md border border-dashed border-brand-border-light p-4">
        <CastTab active={activeTab} onChange={handleTabChange} />

        <CastSearch
          value={searchQuery}
          onChange={(q) => {
            setSearchQuery(q);
            setSelectedId("");
          }}
        />

        <div>
          <label
            htmlFor="cast_selector_target"
            className="block text-xs font-medium text-brand-brown-dark"
          >
            追加対象
          </label>
          <select
            id="cast_selector_target"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setError(null);
            }}
            className="mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
          >
            <option value="">-- 選択してください --</option>
            {currentItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.kana_name ? `（${item.kana_name}）` : ""}
              </option>
            ))}
          </select>
          {currentItems.length === 0 && (
            <p className="mt-1 text-xs text-brand-brown-light">
              該当する対象がいません。
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-brand-gold" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md border border-brand-sky px-3 py-1 text-xs text-brand-sky transition hover:bg-brand-sky-pale"
        >
          出演者を追加
        </button>
      </div>
    </div>
  );
}
