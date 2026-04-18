"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { LiveFormState } from "@/lib/actions/lives";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { LiveInput } from "@/lib/types/live";

type LiveFormAction = (
  prev: LiveFormState,
  formData: FormData
) => Promise<LiveFormState>;

type LiveFormValues = {
  title: string;
  event_date: string;
  start_time: string;
  venue: string;
  description: string;
  url: string;
  is_notified: boolean;
};

type Props = {
  action: LiveFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<LiveInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<LiveInput>): LiveFormValues {
  return {
    title: initial?.title ?? "",
    event_date: initial?.event_date ?? "",
    start_time: initial?.start_time ? initial.start_time.slice(0, 16) : "",
    venue: initial?.venue ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    is_notified: initial?.is_notified ?? false,
  };
}

export function LiveForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<LiveFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<LiveFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, reset]);

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);

  useEffect(() => {
    setCasts(initialCasts ?? []);
  }, [initialCasts]);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("event_date", data.event_date);
    formData.set("start_time", data.start_time);
    formData.set("venue", data.venue);
    formData.set("description", data.description);
    formData.set("url", data.url);
    formData.set("is_notified", String(data.is_notified));

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
          htmlFor="event_date"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          開催日
        </label>
        <input
          id="event_date"
          type="date"
          {...register("event_date")}
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
      </div>

      <div>
        <label
          htmlFor="start_time"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          開演日時
        </label>
        <input
          id="start_time"
          type="datetime-local"
          {...register("start_time")}
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
      </div>

      <div>
        <label
          htmlFor="venue"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          会場
        </label>
        <input
          id="venue"
          type="text"
          {...register("venue")}
          className="mt-1 block w-full rounded-md border border-brand-border-light bg-white px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky"
        />
      </div>

      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          URL（チケットサイト等）
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

      <div className="flex items-center gap-2">
        <input
          id="is_notified"
          type="checkbox"
          {...register("is_notified")}
          className="h-4 w-4 rounded border-brand-border-light text-brand-sky focus:ring-brand-sky"
        />
        <label
          htmlFor="is_notified"
          className="text-sm text-brand-brown-dark"
        >
          通知済み
        </label>
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
