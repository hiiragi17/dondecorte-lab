"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { RadioFormState } from "@/lib/actions/radios";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { RadioInput } from "@/lib/types/radio";

type RadioFormAction = (
  prev: RadioFormState,
  formData: FormData
) => Promise<RadioFormState>;

type RadioFormValues = {
  title: string;
  platform: string;
  url: string;
  published_at: string;
  description: string;
};

type Props = {
  action: RadioFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<RadioInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<RadioInput>): RadioFormValues {
  return {
    title: initial?.title ?? "",
    platform: initial?.platform ?? "",
    url: initial?.url ?? "",
    published_at: initial?.published_at
      ? initial.published_at.slice(0, 16)
      : "",
    description: initial?.description ?? "",
  };
}

export function RadioForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<RadioFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<RadioFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, reset]);

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("platform", data.platform);
    formData.set("url", data.url);
    formData.set("published_at", data.published_at);
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

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
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
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
        {(clientErrors.title?.message || fieldErrors?.title) && (
          <p className="mt-1 text-xs text-brand-gold" role="alert">
            {clientErrors.title?.message ?? fieldErrors?.title}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="platform"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          プラットフォーム
        </label>
        <input
          id="platform"
          type="text"
          {...register("platform")}
          placeholder="例: Spotify, YouTube, stand.fm"
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
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
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
      </div>

      <div>
        <label
          htmlFor="published_at"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          公開日時
        </label>
        <input
          id="published_at"
          type="datetime-local"
          {...register("published_at")}
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          説明
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
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
          className="rounded-md bg-brand-sky px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-sky-dark disabled:opacity-50"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
