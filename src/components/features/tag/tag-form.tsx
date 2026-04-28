"use client";

import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { TagFormState } from "@/lib/actions/tags";
import type { Tag } from "@/lib/types/tag";

type TagFormAction = (
  prev: TagFormState,
  formData: FormData
) => Promise<TagFormState>;

type TagFormValues = {
  name: string;
  slug: string;
  description: string;
  color: string;
};

type Props = {
  action: TagFormAction;
  initialValues?: Partial<Tag>;
  submitLabel: string;
};

export function TagForm({ action, initialValues, submitLabel }: Props) {
  const [state, formAction] = useActionState<TagFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TagFormValues>({
    defaultValues: {
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      color: initialValues?.color ?? "",
    },
  });

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (!message) continue;
      setError(field as keyof TagFormValues, {
        type: "server",
        message,
      });
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
    "mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";

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

      <Field id="name" label="タグ名" required error={errors.name?.message}>
        <input
          id="name"
          type="text"
          autoComplete="off"
          className={inputClass}
          placeholder="例: M-1グランプリ"
          {...register("name", {
            required: "タグ名を入力してください",
            maxLength: { value: 50, message: "50文字以内で入力してください" },
          })}
        />
      </Field>

      <Field id="slug" label="スラッグ（URL用）" required error={errors.slug?.message}>
        <input
          id="slug"
          type="text"
          autoComplete="off"
          className={inputClass}
          placeholder="例: m-1-grand-prix"
          {...register("slug", {
            required: "スラッグを入力してください",
            maxLength: { value: 50, message: "50文字以内で入力してください" },
            pattern: {
              value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "半角英数字とハイフンのみ使用できます",
            },
          })}
        />
        <p className="mt-1 text-xs text-brand-brown-light">
          半角英数字とハイフンのみ。URL に使われます（例: /tags/m-1-grand-prix）。
        </p>
      </Field>

      <Field id="description" label="説明" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          placeholder="このタグの説明（任意）"
          {...register("description", {
            maxLength: { value: 200, message: "200文字以内で入力してください" },
          })}
        />
      </Field>

      <Field id="color" label="表示色（任意）" error={errors.color?.message}>
        <div className="mt-1 flex items-center gap-3">
          <input
            id="color"
            type="text"
            autoComplete="off"
            className={inputClass}
            placeholder="#6BB8D4"
            {...register("color", {
              pattern: {
                value: /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
                message: "#RGB または #RRGGBB の形式で入力してください",
              },
            })}
          />
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-sky px-4 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
        <Link
          href="/admin/tags"
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
