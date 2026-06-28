"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { MagazineFormState, MagazineInput } from "@/lib/types/magazine";

type MagazineFormAction = (
  prev: MagazineFormState,
  formData: FormData
) => Promise<MagazineFormState>;

type MagazineFormValues = {
  title: string;
  magazine_name: string;
  issue: string;
  publisher: string;
  url: string;
  published_on: string;
  description: string;
};

type Props = {
  action: MagazineFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<MagazineInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<MagazineInput>): MagazineFormValues {
  return {
    title: initial?.title ?? "",
    magazine_name: initial?.magazine_name ?? "",
    issue: initial?.issue ?? "",
    publisher: initial?.publisher ?? "",
    url: initial?.url ?? "",
    published_on: initial?.published_on ?? "",
    description: initial?.description ?? "",
  };
}

export function MagazineForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<MagazineFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<MagazineFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);

  useEffect(() => {
    reset(toFormValues(initialValues));
    setCasts(initialCasts ?? []);
  }, [initialCasts, initialValues, reset]);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("magazine_name", data.magazine_name);
    formData.set("issue", data.issue);
    formData.set("publisher", data.publisher);
    formData.set("url", data.url);
    formData.set("published_on", data.published_on);
    formData.set("description", data.description);

    for (const cast of casts) {
      formData.append("cast_type", cast.type);
      formData.append("cast_id", cast.id);
      formData.append("cast_name", cast.name);
    }

    startTransition(() => {
      formAction(formData);
    });
  });

  const fieldErrors = state.fieldErrors;

  const inputClass =
    "mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";
  const inputWithPlaceholderClass = `${inputClass} placeholder-brand-brown-light`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.error && (
        <p
          className="rounded-md border border-brand-gold bg-brand-bg-light px-4 py-3 text-sm text-brand-brown-dark"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          タイトル <span className="text-brand-gold">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title", {
            required: "タイトルを入力してください",
            maxLength: { value: 200, message: "200文字以内で入力してください" },
          })}
          className={inputClass}
        />
        {(clientErrors.title?.message || fieldErrors?.title) && (
          <p className="mt-1 text-xs text-brand-gold" role="alert">
            {clientErrors.title?.message ?? fieldErrors?.title}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="published_on"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          発売日
        </label>
        <input
          id="published_on"
          type="date"
          {...register("published_on")}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="magazine_name"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          誌名
        </label>
        <input
          id="magazine_name"
          type="text"
          {...register("magazine_name")}
          placeholder="例: ○○マガジン"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="issue"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          号数
        </label>
        <input
          id="issue"
          type="text"
          {...register("issue")}
          placeholder="例: 2026年7月号"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="publisher"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          出版社
        </label>
        <input
          id="publisher"
          type="text"
          {...register("publisher")}
          placeholder="例: ○○出版"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          URL
        </label>
        <input
          id="url"
          type="url"
          {...register("url")}
          placeholder="https://..."
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          メモ・内容
        </label>
        <textarea
          id="description"
          rows={6}
          {...register("description")}
          className={inputClass}
        />
        <p className="mt-0.5 text-xs text-brand-brown-light">
          Markdown 記法が使えます。本文の転載は不可。
        </p>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-brand-brown-dark">
          出演者
        </p>
        {fieldErrors?.casts && (
          <p className="mb-2 text-xs text-brand-gold" role="alert">
            {fieldErrors.casts}
          </p>
        )}
        <CastSelector
          artists={artists}
          combos={combos}
          units={units}
          value={casts}
          onChange={setCasts}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-sky px-5 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:opacity-50"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
