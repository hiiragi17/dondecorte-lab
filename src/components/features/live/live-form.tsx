"use client";

import { useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { LiveFormState } from "@/lib/types/live";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import {
  LIVE_SCHEDULE_PHASE_LABEL,
  LIVE_SCHEDULE_PHASES,
  type LiveInput,
  type LiveSchedule,
  type LiveSchedulePhase,
} from "@/lib/types/live";

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

type ScheduleRow = {
  phase_type: LiveSchedulePhase;
  label: string;
  start_date: string;
  end_date: string;
  start_time: string;
  url: string;
};

type Props = {
  action: LiveFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<LiveInput>;
  initialCasts?: CastEntry[];
  initialSchedules?: LiveSchedule[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<LiveInput>): LiveFormValues {
  return {
    title: initial?.title ?? "",
    event_date: initial?.event_date ?? "",
    start_time: initial?.start_time ? initial.start_time.slice(11, 16) : "",
    venue: initial?.venue ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    is_notified: initial?.is_notified ?? false,
  };
}

function toScheduleRows(schedules?: LiveSchedule[]): ScheduleRow[] {
  return (schedules ?? []).map((s) => ({
    phase_type: s.phase_type,
    label: s.label ?? "",
    start_date: s.start_date,
    end_date: s.end_date ?? "",
    start_time: s.start_time ? s.start_time.slice(11, 16) : "",
    url: s.url ?? "",
  }));
}

function emptyScheduleRow(): ScheduleRow {
  return {
    phase_type: "lottery",
    label: "",
    start_date: "",
    end_date: "",
    start_time: "",
    url: "",
  };
}

const fieldClass =
  "mt-1 block w-full rounded-md border border-brand-border-light bg-brand-card-light px-3 py-2 text-sm text-brand-brown-dark focus:border-brand-sky focus:outline-none focus:ring-1 focus:ring-brand-sky";

export function LiveForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  initialSchedules,
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
  } = useForm<LiveFormValues>({
    defaultValues: toFormValues(initialValues),
  });

  const [casts, setCasts] = useState<CastEntry[]>(initialCasts ?? []);
  const [schedules, setSchedules] = useState<ScheduleRow[]>(
    toScheduleRows(initialSchedules)
  );

  function updateSchedule(index: number, patch: Partial<ScheduleRow>) {
    setSchedules((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function removeSchedule(index: number) {
    setSchedules((rows) => rows.filter((_, i) => i !== index));
  }

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

    for (const row of schedules) {
      if (!row.start_date) continue;
      formData.append("schedule_phase", row.phase_type);
      formData.append("schedule_label", row.label);
      formData.append("schedule_start", row.start_date);
      formData.append("schedule_end", row.end_date);
      formData.append("schedule_time", row.start_time);
      formData.append("schedule_url", row.url);
    }

    startTransition(() => {
      formAction(formData);
    });
  });

  const fieldErrors = state.fieldErrors;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.error && (
        <p className="rounded-md bg-brand-bg-light px-4 py-3 text-sm text-brand-brown-dark" role="alert">
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
          className={fieldClass}
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
          className={fieldClass}
        />
        {fieldErrors?.event_date && (
          <p className="mt-1 text-xs text-brand-gold" role="alert">
            {fieldErrors.event_date}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="start_time"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          開演時刻
        </label>
        <input
          id="start_time"
          type="time"
          {...register("start_time")}
          className={fieldClass}
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
          className={fieldClass}
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
          className={`${fieldClass} placeholder-brand-brown-light`}
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
          className={fieldClass}
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

      <fieldset className="rounded-lg border border-brand-border-light p-4">
        <legend className="px-1 text-sm font-medium text-brand-brown-dark">
          チケットスケジュール（抽選・販売期間）
        </legend>
        <p className="mb-3 text-xs text-brand-brown-light">
          抽選期間・販売期間を登録するとカレンダーに帯で表示され、各期間を個別に
          Google カレンダーへ追加できます。当日はこの上の「開催日」を使います。
        </p>
        {fieldErrors?.schedules && (
          <p className="mb-2 text-xs text-brand-gold" role="alert">
            {fieldErrors.schedules}
          </p>
        )}

        <div className="space-y-4">
          {schedules.map((row, index) => (
            <div
              key={index}
              className="rounded-md border border-brand-border-light bg-brand-bg-light/40 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    種別
                  </label>
                  <select
                    value={row.phase_type}
                    onChange={(e) =>
                      updateSchedule(index, {
                        phase_type: e.target.value as LiveSchedulePhase,
                      })
                    }
                    className={fieldClass}
                  >
                    {LIVE_SCHEDULE_PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {LIVE_SCHEDULE_PHASE_LABEL[phase]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    ラベル（任意）
                  </label>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) =>
                      updateSchedule(index, { label: e.target.value })
                    }
                    placeholder="一次抽選 / 先行販売 など"
                    className={`${fieldClass} placeholder-brand-brown-light`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    開始日 <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="date"
                    value={row.start_date}
                    onChange={(e) =>
                      updateSchedule(index, { start_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    終了日（任意）
                  </label>
                  <input
                    type="date"
                    value={row.end_date}
                    onChange={(e) =>
                      updateSchedule(index, { end_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    締切時刻（任意）
                  </label>
                  <input
                    type="time"
                    value={row.start_time}
                    onChange={(e) =>
                      updateSchedule(index, { start_time: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-brown-dark">
                    URL（申込・購入）
                  </label>
                  <input
                    type="url"
                    value={row.url}
                    onChange={(e) =>
                      updateSchedule(index, { url: e.target.value })
                    }
                    placeholder="https://..."
                    className={`${fieldClass} placeholder-brand-brown-light`}
                  />
                </div>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="text-xs text-brand-gold transition hover:underline"
                >
                  この期間を削除
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSchedules((rows) => [...rows, emptyScheduleRow()])}
          className="mt-3 rounded-md border border-brand-border-light px-3 py-1.5 text-xs font-medium text-brand-sky transition hover:border-brand-sky"
        >
          ＋ 期間を追加
        </button>
      </fieldset>

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
