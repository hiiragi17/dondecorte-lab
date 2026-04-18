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
import type { AchievementFormState } from "@/lib/actions/achievements";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { Achievement, AchievementTargetType } from "@/lib/types/achievement";

type AchievementFormAction = (
  prev: AchievementFormState,
  formData: FormData
) => Promise<AchievementFormState>;

type AchievementFormValues = {
  title: string;
  result: string;
  year: string;
  sort_order: string;
};

type Props = {
  action: AchievementFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<Achievement>;
  submitLabel: string;
};

const TARGET_TYPE_OPTIONS: { value: AchievementTargetType; label: string }[] =
  [
    { value: "comedy_group", label: "コンビ" },
    { value: "artist", label: "芸人（個人）" },
    { value: "unit", label: "ユニット" },
  ];

function getInitialTargetType(
  initial?: Partial<Achievement>
): AchievementTargetType {
  if (initial?.artist_id) return "artist";
  if (initial?.unit_id) return "unit";
  return "comedy_group";
}

function getInitialTargetId(
  initial?: Partial<Achievement>,
  type?: AchievementTargetType
): string {
  if (type === "artist") return initial?.artist_id ?? "";
  if (type === "unit") return initial?.unit_id ?? "";
  return initial?.comedy_group_id ?? "";
}

export function AchievementForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<AchievementFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const defaultTargetType = getInitialTargetType(initialValues);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AchievementFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      result: initialValues?.result ?? "",
      year: initialValues?.year ? String(initialValues.year) : String(new Date().getFullYear()),
      sort_order: String(initialValues?.sort_order ?? 0),
    },
  });

  const [targetType, setTargetType] =
    useState<AchievementTargetType>(defaultTargetType);
  const [targetId, setTargetId] = useState(
    getInitialTargetId(initialValues, defaultTargetType)
  );

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (!message) continue;
      if (field === "target_type" || field === "target_id") continue;
      setError(field as keyof AchievementFormValues, {
        type: "server",
        message,
      });
    }
  }, [state, setError]);

  const targetOptions = useMemo(() => {
    if (targetType === "artist") {
      return artists.map((a) => ({ id: a.id, label: a.name }));
    }
    if (targetType === "unit") {
      return units.map((u) => ({ id: u.id, label: u.name }));
    }
    return combos.map((c) => ({ id: c.id, label: c.name }));
  }, [targetType, artists, combos, units]);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value ?? "");
    }
    formData.append("target_type", targetType);
    formData.append("target_id", targetId);
    startTransition(() => {
      formAction(formData);
    });
  });

  const inputClass =
    "mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-brand-brown-dark placeholder-brand-brown-light focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";

  const targetTypeError = state.fieldErrors?.target_type;
  const targetIdError = state.fieldErrors?.target_id;

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
        <h2 className="text-sm font-semibold text-brand-brown-dark">受賞情報</h2>

        <Field id="title" label="大会名・タイトル" required error={errors.title?.message}>
          <input
            id="title"
            type="text"
            autoComplete="off"
            className={inputClass}
            placeholder="例: M-1グランプリ 2025"
            {...register("title", {
              required: "タイトルを入力してください",
              maxLength: { value: 200, message: "200文字以内で入力してください" },
            })}
          />
        </Field>

        <Field id="result" label="結果" required error={errors.result?.message}>
          <input
            id="result"
            type="text"
            autoComplete="off"
            className={inputClass}
            placeholder="例: 準優勝、準決勝進出"
            {...register("result", {
              required: "結果を入力してください",
              maxLength: { value: 100, message: "100文字以内で入力してください" },
            })}
          />
        </Field>

        <Field id="year" label="年" required error={errors.year?.message}>
          <input
            id="year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            className={inputClass}
            {...register("year", {
              required: "年を入力してください",
              validate: (value) => {
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
          id="sort_order"
          label="表示順（小さいほど上に表示）"
          error={errors.sort_order?.message}
        >
          <input
            id="sort_order"
            type="number"
            inputMode="numeric"
            className={inputClass}
            {...register("sort_order")}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-brown-dark">対象</h2>

        <div>
          <label className="block text-sm font-medium text-brand-brown-dark">
            種別 <span className="ml-1 text-brand-gold">*</span>
          </label>
          <div className="mt-2 flex gap-3">
            {TARGET_TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm text-brand-brown-dark cursor-pointer">
                <input
                  type="radio"
                  name="target_type"
                  value={opt.value}
                  checked={targetType === opt.value}
                  onChange={() => {
                    setTargetType(opt.value);
                    setTargetId("");
                  }}
                  className="accent-brand-sky"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {targetTypeError && (
            <p className="mt-1 text-xs text-brand-gold" role="alert">
              {targetTypeError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="target_id"
            className="block text-sm font-medium text-brand-brown-dark"
          >
            対象を選択 <span className="ml-1 text-brand-gold">*</span>
          </label>
          <select
            id="target_id"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- 選択してください --</option>
            {targetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {targetIdError && (
            <p className="mt-1 text-xs text-brand-gold" role="alert">
              {targetIdError}
            </p>
          )}
          {targetOptions.length === 0 && (
            <p className="mt-1 text-xs text-brand-brown-light">
              対象が登録されていません。先に登録してください。
            </p>
          )}
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
          href="/admin/achievements"
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
