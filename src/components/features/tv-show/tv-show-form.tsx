"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { TvShowFormState } from "@/lib/actions/tv-shows";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { TvShowInput } from "@/lib/types/tv-show";

type TvShowFormAction = (
  prev: TvShowFormState,
  formData: FormData
) => Promise<TvShowFormState>;

type TvShowFormValues = {
  title: string;
  network: string;
  air_date: string;
  air_time: string;
  description: string;
  url: string;
};

type Props = {
  action: TvShowFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<TvShowInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<TvShowInput>): TvShowFormValues {
  return {
    title: initial?.title ?? "",
    network: initial?.network ?? "",
    air_date: initial?.air_date ?? "",
    air_time: initial?.air_time
      ? initial.air_time.slice(0, 16)
      : "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
  };
}

export function TvShowForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<TvShowFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<TvShowFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, reset]);

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("network", data.network);
    formData.set("air_date", data.air_date);
    formData.set("air_time", data.air_time);
    formData.set("description", data.description);
    formData.set("url", data.url);

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
        <p className="rounded-md border border-brand-gold bg-brand-bg-light px-4 py-3 text-sm text-brand-brown-dark" role="alert">
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
          {...register("title", { required: "タイトルを入力してください", maxLength: { value: 200, message: "200文字以内で入力してください" } })}
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
          htmlFor="network"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          放送局
        </label>
        <input
          id="network"
          type="text"
          {...register("network")}
          placeholder="例: フジテレビ、NHK"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="air_date"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          放送日
        </label>
        <input
          id="air_date"
          type="date"
          {...register("air_date")}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="air_time"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          放送日時
        </label>
        <input
          id="air_time"
          type="datetime-local"
          {...register("air_time")}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          メモ・説明
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className={inputClass}
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
        <p className="mt-0.5 text-xs text-brand-brown-light">
          TVer等の視聴リンクを登録してください。
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
