"use client";

import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { ArtistFormState } from "@/lib/actions/artists";
import type { ArtistInput } from "@/lib/types/artist";

type ArtistFormAction = (
  prev: ArtistFormState,
  formData: FormData
) => Promise<ArtistFormState>;

type ArtistFormValues = {
  name: string;
  kana_name: string;
  profile: string;
  debut_year: string;
  image_url: string;
  x_url: string;
  instagram_url: string;
  note_url: string;
  youtube_channel_url: string;
  tiktok_url: string;
  website_url: string;
};

type Props = {
  action: ArtistFormAction;
  initialValues?: Partial<ArtistInput>;
  submitLabel: string;
};

const URL_PATTERN =
  /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/i;

const FIELD_LABELS: Record<keyof ArtistFormValues, string> = {
  name: "名前",
  kana_name: "よみがな",
  profile: "プロフィール",
  debut_year: "デビュー年",
  image_url: "画像URL",
  x_url: "X（Twitter）",
  instagram_url: "Instagram",
  note_url: "note",
  youtube_channel_url: "YouTube チャンネル",
  tiktok_url: "TikTok",
  website_url: "Webサイト",
};

function toFormValues(initial?: Partial<ArtistInput>): ArtistFormValues {
  return {
    name: initial?.name ?? "",
    kana_name: initial?.kana_name ?? "",
    profile: initial?.profile ?? "",
    debut_year:
      initial?.debut_year != null ? String(initial.debut_year) : "",
    image_url: initial?.image_url ?? "",
    x_url: initial?.x_url ?? "",
    instagram_url: initial?.instagram_url ?? "",
    note_url: initial?.note_url ?? "",
    youtube_channel_url: initial?.youtube_channel_url ?? "",
    tiktok_url: initial?.tiktok_url ?? "",
    website_url: initial?.website_url ?? "",
  };
}

export function ArtistForm({ action, initialValues, submitLabel }: Props) {
  const [state, formAction] = useActionState<ArtistFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (message) {
        setError(field as keyof ArtistFormValues, {
          type: "server",
          message,
        });
      }
    }
  }, [state, setError]);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value ?? "");
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
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
          id="profile"
          label={FIELD_LABELS.profile}
          error={errors.profile?.message}
        >
          <textarea
            id="profile"
            rows={4}
            className={inputClass}
            {...register("profile")}
          />
        </Field>

        <Field
          id="debut_year"
          label={FIELD_LABELS.debut_year}
          error={errors.debut_year?.message}
        >
          <input
            id="debut_year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            className={inputClass}
            {...register("debut_year", {
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
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">SNS</h2>

        {(
          [
            "x_url",
            "instagram_url",
            "note_url",
            "youtube_channel_url",
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
          href="/admin/artists"
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
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
