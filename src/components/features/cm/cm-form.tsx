"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { CmFormState, CmInput } from "@/lib/types/cm";

type CmFormAction = (
  prev: CmFormState,
  formData: FormData
) => Promise<CmFormState>;

type CmFormValues = {
  title: string;
  advertiser: string;
  product: string;
  url: string;
  aired_on: string;
  description: string;
};

type Props = {
  action: CmFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<CmInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<CmInput>): CmFormValues {
  return {
    title: initial?.title ?? "",
    advertiser: initial?.advertiser ?? "",
    product: initial?.product ?? "",
    url: initial?.url ?? "",
    aired_on: initial?.aired_on ?? "",
    description: initial?.description ?? "",
  };
}

export function CmForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<CmFormState, FormData>(action, {});
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<CmFormValues>({
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
    formData.set("advertiser", data.advertiser);
    formData.set("product", data.product);
    formData.set("url", data.url);
    formData.set("aired_on", data.aired_on);
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
          htmlFor="aired_on"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          放送・公開日
        </label>
        <input
          id="aired_on"
          type="date"
          {...register("aired_on")}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="advertiser"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          企業・ブランド
        </label>
        <input
          id="advertiser"
          type="text"
          {...register("advertiser")}
          placeholder="例: ○○株式会社"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="product"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          商品・サービス
        </label>
        <input
          id="product"
          type="text"
          {...register("product")}
          placeholder="例: ○○（商品名）"
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
          Markdown 記法が使えます。
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
