"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { ArticleFormState } from "@/lib/actions/articles";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { ArticleInput } from "@/lib/types/article";

type ArticleFormAction = (
  prev: ArticleFormState,
  formData: FormData
) => Promise<ArticleFormState>;

type ArticleFormValues = {
  title: string;
  url: string;
  source: string;
  published_at: string;
  content: string;
};

type Props = {
  action: ArticleFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<ArticleInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<ArticleInput>): ArticleFormValues {
  return {
    title: initial?.title ?? "",
    url: initial?.url ?? "",
    source: initial?.source ?? "",
    published_at: initial?.published_at
      ? initial.published_at.slice(0, 16)
      : "",
    content: initial?.content ?? "",
  };
}

export function ArticleForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<ArticleFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<ArticleFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, reset]);

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("url", data.url);
    formData.set("source", data.source);
    formData.set("published_at", data.published_at);
    formData.set("content", data.content);

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
          記事本文の転載不可。元記事へのリンクのみ登録してください。
        </p>
      </div>

      <div>
        <label
          htmlFor="source"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          媒体名
        </label>
        <input
          id="source"
          type="text"
          {...register("source")}
          placeholder="例: 週刊お笑い、ナタリー"
          className={inputWithPlaceholderClass}
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
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          メモ・要約
        </label>
        <textarea
          id="content"
          rows={4}
          {...register("content")}
          className={inputClass}
        />
        <p className="mt-0.5 text-xs text-brand-brown-light">
          本文転載不可。自分用のメモや要約のみ記入可能です。
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
