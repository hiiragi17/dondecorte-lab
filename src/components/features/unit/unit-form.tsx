"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import type { UnitFormState } from "@/lib/actions/units";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitInput, UnitMemberEntry } from "@/lib/types/unit";

type UnitFormAction = (
  prev: UnitFormState,
  formData: FormData
) => Promise<UnitFormState>;

type UnitFormValues = {
  name: string;
  description: string;
};

type Props = {
  action: UnitFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  initialValues?: Partial<UnitInput>;
  initialMembers?: UnitMemberEntry[];
  submitLabel: string;
};

type MemberTab = "comedy_group" | "artist";

function toFormValues(initial?: Partial<UnitInput>): UnitFormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  };
}

export function UnitForm({
  action,
  artists,
  combos,
  initialValues,
  initialMembers,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<UnitFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnitFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  const [members, setMembers] = useState<UnitMemberEntry[]>(
    () => initialMembers ?? []
  );
  const [localMemberError, setLocalMemberError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MemberTab>("comedy_group");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const memberError = localMemberError ?? state.fieldErrors?.members ?? null;

  const selectedComboIds = useMemo(
    () =>
      new Set(
        members.filter((m) => m.type === "comedy_group").map((m) => m.id)
      ),
    [members]
  );
  const selectedArtistIds = useMemo(
    () =>
      new Set(members.filter((m) => m.type === "artist").map((m) => m.id)),
    [members]
  );

  const filteredCombos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combos
      .filter((c) => !selectedComboIds.has(c.id))
      .filter((c) =>
        !q
          ? true
          : c.name.toLowerCase().includes(q) ||
            (c.kana_name ?? "").toLowerCase().includes(q)
      );
  }, [combos, searchQuery, selectedComboIds]);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return artists
      .filter((a) => !selectedArtistIds.has(a.id))
      .filter((a) =>
        !q
          ? true
          : a.name.toLowerCase().includes(q) ||
            (a.kana_name ?? "").toLowerCase().includes(q)
      );
  }, [artists, searchQuery, selectedArtistIds]);

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (!message) continue;
      if (field === "members") continue;
      setError(field as keyof UnitFormValues, { type: "server", message });
    }
  }, [state, setError]);

  const addMember = () => {
    if (!selectedId) {
      setLocalMemberError("追加する対象を選択してください");
      return;
    }

    if (activeTab === "comedy_group") {
      const combo = combos.find((c) => c.id === selectedId);
      if (!combo) {
        setLocalMemberError("選択したコンビが見つかりません");
        return;
      }
      if (selectedComboIds.has(combo.id)) {
        setLocalMemberError("すでに追加されています");
        return;
      }
      setMembers((prev) => [
        ...prev,
        { type: "comedy_group", id: combo.id, name: combo.name, kana_name: combo.kana_name },
      ]);
    } else {
      const artist = artists.find((a) => a.id === selectedId);
      if (!artist) {
        setLocalMemberError("選択した芸人が見つかりません");
        return;
      }
      if (selectedArtistIds.has(artist.id)) {
        setLocalMemberError("すでに追加されています");
        return;
      }
      setMembers((prev) => [
        ...prev,
        { type: "artist", id: artist.id, name: artist.name, kana_name: artist.kana_name },
      ]);
    }

    setSelectedId("");
    setSearchQuery("");
    setLocalMemberError(null);
  };

  const removeMember = (type: MemberTab, id: string) => {
    setMembers((prev) => prev.filter((m) => !(m.type === type && m.id === id)));
  };

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value ?? "");
    }
    for (const m of members) {
      formData.append("member_type", m.type);
      formData.append("member_id", m.id);
      formData.append("member_name", m.name);
    }
    startTransition(() => {
      formAction(formData);
    });
  });

  const inputClass =
    "mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";

  const currentList =
    activeTab === "comedy_group" ? filteredCombos : filteredArtists;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.error && (
        <p
          className="rounded-md bg-brand-cream px-3 py-2 text-sm text-brand-brown-dark"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">基本情報</h2>

        <Field id="name" label="名前" required error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="off"
            className={inputClass}
            {...register("name", {
              required: "名前を入力してください",
              maxLength: { value: 100, message: "100文字以内で入力してください" },
            })}
          />
        </Field>

        <Field id="description" label="説明" error={errors.description?.message}>
          <textarea
            id="description"
            rows={4}
            className={inputClass}
            {...register("description")}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">メンバー</h2>

        {memberError && (
          <p
            className="rounded-md bg-brand-cream px-3 py-2 text-sm text-brand-brown-dark"
            role="alert"
          >
            {memberError}
          </p>
        )}

        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs text-brand-brown-light">
              まだメンバーが追加されていません。
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={`${m.type}:${m.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-brand-border-light bg-brand-bg-light px-3 py-2 text-sm"
                >
                  <div>
                    <span className="mr-2 rounded-sm bg-brand-cream px-2 py-0.5 text-xs text-brand-brown-light">
                      {m.type === "comedy_group" ? "コンビ" : "個人"}
                    </span>
                    <span className="font-medium text-brand-brown-dark">
                      {m.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeMember(m.type as MemberTab, m.id)
                    }
                    className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-card-light"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border border-dashed border-brand-border-light p-4">
          <div className="flex gap-2">
            {(["comedy_group", "artist"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedId("");
                  setSearchQuery("");
                  setLocalMemberError(null);
                }}
                className={
                  activeTab === tab
                    ? "rounded-md bg-brand-sky px-3 py-1 text-xs font-medium text-brand-cream"
                    : "rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-brand-bg-light"
                }
              >
                {tab === "comedy_group" ? "コンビ" : "個人"}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="unit_member_search"
              className="block text-xs font-medium text-brand-brown-dark"
            >
              {activeTab === "comedy_group" ? "コンビを検索" : "芸人を検索"}
            </label>
            <input
              id="unit_member_search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedId("");
              }}
              placeholder="名前で検索"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="unit_member_select"
              className="block text-xs font-medium text-brand-brown-dark"
            >
              選択
            </label>
            <select
              id="unit_member_select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- 選択してください --</option>
              {currentList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {"kana_name" in item && item.kana_name
                    ? `（${item.kana_name}）`
                    : ""}
                </option>
              ))}
            </select>
            {currentList.length === 0 && (
              <p className="mt-1 text-xs text-brand-brown-light">
                該当する{activeTab === "comedy_group" ? "コンビ" : "芸人"}がいません。
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={addMember}
            className="rounded-md border border-brand-sky px-3 py-1 text-xs text-brand-sky transition hover:bg-brand-sky-pale"
          >
            メンバーを追加
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
        <Link
          href="/admin/units"
          className="rounded-md border border-brand-border-light px-4 py-2 text-sm text-brand-brown-dark transition hover:bg-brand-bg-light"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-brand-brown-dark"
      >
        {label}
        {required && <span className="ml-1 text-brand-gold">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-brand-gold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
