"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { ComboFormState } from "@/lib/actions/combos";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboGroupType, ComboInput } from "@/lib/types/combo";

type ComboFormAction = (
  prev: ComboFormState,
  formData: FormData
) => Promise<ComboFormState>;

type ComboFormValues = {
  name: string;
  kana_name: string;
  group_type: ComboGroupType;
  description: string;
  formed_year: string;
  image_url: string;
  theme_color: string;
  x_url: string;
  instagram_url: string;
  note_url: string;
  youtube_channel_url: string;
  youtube_channel_id: string;
  standfm_url: string;
  tiktok_url: string;
  website_url: string;
};

type MemberDraft = {
  artist_id: string;
  artist_name: string;
  artist_kana: string | null;
  role: string;
};

export type ComboFormInitialMember = {
  artist_id: string;
  artist_name: string;
  artist_kana?: string | null;
  role: string | null;
};

type Props = {
  action: ComboFormAction;
  artists: ArtistSummary[];
  initialValues?: Partial<ComboInput>;
  initialMembers?: ComboFormInitialMember[];
  submitLabel: string;
};

const URL_PATTERN =
  /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/i;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const FIELD_LABELS: Record<keyof ComboFormValues, string> = {
  name: "名前",
  kana_name: "よみがな",
  group_type: "種別",
  description: "説明",
  formed_year: "結成年",
  image_url: "画像URL",
  theme_color: "テーマカラー",
  x_url: "X（Twitter）",
  instagram_url: "Instagram",
  note_url: "note",
  youtube_channel_url: "YouTube チャンネルURL",
  youtube_channel_id: "YouTube チャンネルID",
  standfm_url: "stand.fm",
  tiktok_url: "TikTok",
  website_url: "Webサイト",
};

const GROUP_TYPE_OPTIONS: { value: ComboGroupType; label: string }[] = [
  { value: "combo", label: "コンビ" },
  { value: "trio", label: "トリオ" },
  { value: "quartet", label: "カルテット" },
  { value: "other", label: "その他" },
];

function toFormValues(initial?: Partial<ComboInput>): ComboFormValues {
  return {
    name: initial?.name ?? "",
    kana_name: initial?.kana_name ?? "",
    group_type: initial?.group_type ?? "combo",
    description: initial?.description ?? "",
    formed_year:
      initial?.formed_year != null ? String(initial.formed_year) : "",
    image_url: initial?.image_url ?? "",
    theme_color: initial?.theme_color ?? "",
    x_url: initial?.x_url ?? "",
    instagram_url: initial?.instagram_url ?? "",
    note_url: initial?.note_url ?? "",
    youtube_channel_url: initial?.youtube_channel_url ?? "",
    youtube_channel_id: initial?.youtube_channel_id ?? "",
    standfm_url: initial?.standfm_url ?? "",
    tiktok_url: initial?.tiktok_url ?? "",
    website_url: initial?.website_url ?? "",
  };
}

export function ComboForm({
  action,
  artists,
  initialValues,
  initialMembers,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<ComboFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComboFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  const [members, setMembers] = useState<MemberDraft[]>(
    () =>
      initialMembers?.map((m) => ({
        artist_id: m.artist_id,
        artist_name: m.artist_name,
        artist_kana: m.artist_kana ?? null,
        role: m.role ?? "",
      })) ?? []
  );
  const [localMemberError, setLocalMemberError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<string>("");
  const [roleInput, setRoleInput] = useState("");

  const memberError = localMemberError ?? state.fieldErrors?.members ?? null;

  const selectedIds = useMemo(
    () => new Set(members.map((m) => m.artist_id)),
    [members]
  );

  const filteredArtists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return artists
      .filter((a) => !selectedIds.has(a.id))
      .filter((a) => {
        if (!query) return true;
        return (
          a.name.toLowerCase().includes(query) ||
          (a.kana_name ?? "").toLowerCase().includes(query)
        );
      });
  }, [artists, searchQuery, selectedIds]);

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (!message) continue;
      if (field === "members") continue;
      setError(field as keyof ComboFormValues, {
        type: "server",
        message,
      });
    }
  }, [state, setError]);

  const addMember = () => {
    if (!selectedArtistId) {
      setLocalMemberError("追加する芸人を選択してください");
      return;
    }
    const artist = artists.find((a) => a.id === selectedArtistId);
    if (!artist) {
      setLocalMemberError("選択した芸人が見つかりません");
      return;
    }
    if (selectedIds.has(artist.id)) {
      setLocalMemberError("すでに追加されています");
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        artist_id: artist.id,
        artist_name: artist.name,
        artist_kana: artist.kana_name,
        role: roleInput.trim(),
      },
    ]);
    setSelectedArtistId("");
    setRoleInput("");
    setSearchQuery("");
    setLocalMemberError(null);
  };

  const removeMember = (artistId: string) => {
    setMembers((prev) => prev.filter((m) => m.artist_id !== artistId));
  };

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value ?? "");
    }
    for (const m of members) {
      formData.append("member_artist_id", m.artist_id);
      formData.append("member_role", m.role);
    }
    startTransition(() => {
      formAction(formData);
    });
  });

  const inputClass =
    "mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.error && (
        <p className="rounded-md bg-brand-cream px-3 py-2 text-sm text-brand-brown-dark" role="alert">
          {state.error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">基本情報</h2>

        <Field
          id="name"
          label={FIELD_LABELS.name}
          required
          error={errors.name?.message}
        >
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

        <Field
          id="kana_name"
          label={FIELD_LABELS.kana_name}
          error={errors.kana_name?.message}
        >
          <input
            id="kana_name"
            type="text"
            autoComplete="off"
            className={inputClass}
            {...register("kana_name", {
              maxLength: { value: 100, message: "100文字以内で入力してください" },
            })}
          />
        </Field>

        <Field
          id="group_type"
          label={FIELD_LABELS.group_type}
          required
          error={errors.group_type?.message}
        >
          <select
            id="group_type"
            className={inputClass}
            {...register("group_type", { required: "種別を選択してください" })}
          >
            {GROUP_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="description"
          label={FIELD_LABELS.description}
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={4}
            className={inputClass}
            {...register("description")}
          />
        </Field>

        <Field
          id="formed_year"
          label={FIELD_LABELS.formed_year}
          error={errors.formed_year?.message}
        >
          <input
            id="formed_year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            className={inputClass}
            {...register("formed_year", {
              validate: (value) => {
                if (!value) return true;
                const num = Number(value);
                if (!Number.isInteger(num) || num < 1900 || num > 2100) {
                  return "1900〜2100の整数で入力してください";
                }
                return true;
              },
            })}
          />
        </Field>

        <Field
          id="image_url"
          label={FIELD_LABELS.image_url}
          error={errors.image_url?.message}
        >
          <input
            id="image_url"
            type="url"
            inputMode="url"
            className={inputClass}
            placeholder="https://..."
            {...register("image_url", {
              pattern: { value: URL_PATTERN, message: "http(s)のURLを入力してください" },
            })}
          />
        </Field>

        <Field
          id="theme_color"
          label={FIELD_LABELS.theme_color}
          error={errors.theme_color?.message}
        >
          <input
            id="theme_color"
            type="text"
            className={inputClass}
            placeholder="#5C3D2E"
            {...register("theme_color", {
              validate: (value) => {
                if (!value) return true;
                return (
                  HEX_COLOR_PATTERN.test(value) ||
                  "#RRGGBB 形式で入力してください"
                );
              },
            })}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">メンバー</h2>

        {memberError && (
          <p className="rounded-md bg-brand-cream px-3 py-2 text-sm text-brand-brown-dark" role="alert">
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
                  key={m.artist_id}
                  className="flex items-center justify-between gap-3 rounded-md border border-brand-border-light bg-brand-bg-light px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-brand-brown-dark">
                      {m.artist_name}
                    </span>
                    {m.role && (
                      <span className="ml-2 rounded-sm bg-white px-2 py-0.5 text-xs text-brand-brown-light">
                        {m.role}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(m.artist_id)}
                    className="rounded-md border border-brand-border-light px-3 py-1 text-xs text-brand-brown-dark transition hover:bg-white"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border border-dashed border-brand-border-light p-4">
          <div>
            <label
              htmlFor="member_search"
              className="block text-xs font-medium text-brand-brown-dark"
            >
              芸人を検索
            </label>
            <input
              id="member_search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前またはよみがなで検索"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="member_artist"
              className="block text-xs font-medium text-brand-brown-dark"
            >
              芸人を選択
            </label>
            <select
              id="member_artist"
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- 選択してください --</option>
              {filteredArtists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.kana_name ? `(${a.kana_name})` : ""}
                </option>
              ))}
            </select>
            {filteredArtists.length === 0 && (
              <p className="mt-1 text-xs text-brand-brown-light">
                該当する芸人がいません。
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="member_role"
              className="block text-xs font-medium text-brand-brown-dark"
            >
              役割（任意。例: ボケ／ツッコミ）
            </label>
            <input
              id="member_role"
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className={inputClass}
              placeholder="ボケ"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={addMember}
              className="rounded-md border border-brand-sky px-3 py-1 text-xs text-brand-sky transition hover:bg-brand-sky-pale"
            >
              メンバーを追加
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">SNS・リンク</h2>

        {(
          [
            "x_url",
            "instagram_url",
            "note_url",
            "youtube_channel_url",
            "standfm_url",
            "tiktok_url",
            "website_url",
          ] as const
        ).map((key) => (
          <Field
            key={key}
            id={key}
            label={FIELD_LABELS[key]}
            error={errors[key]?.message}
          >
            <input
              id={key}
              type="url"
              inputMode="url"
              className={inputClass}
              placeholder="https://..."
              {...register(key, {
                pattern: { value: URL_PATTERN, message: "http(s)のURLを入力してください" },
              })}
            />
          </Field>
        ))}

        <Field
          id="youtube_channel_id"
          label={FIELD_LABELS.youtube_channel_id}
          error={errors.youtube_channel_id?.message}
        >
          <input
            id="youtube_channel_id"
            type="text"
            autoComplete="off"
            className={inputClass}
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
            {...register("youtube_channel_id")}
          />
        </Field>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
        <Link
          href="/admin/combos"
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
      <label htmlFor={id} className="block text-sm font-medium text-brand-brown-dark">
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
