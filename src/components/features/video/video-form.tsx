"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { CastSelector } from "@/components/features/cast-selector/cast-selector";
import type { VideoFormState } from "@/lib/actions/videos";
import type { ArtistSummary } from "@/lib/queries/artists";
import type { ComboSummary } from "@/lib/queries/combos";
import type { UnitSummary } from "@/lib/queries/units";
import type { CastEntry } from "@/lib/types";
import type { VideoInput } from "@/lib/types/video";
import { extractYoutubeVideoId } from "@/lib/utils/youtube";

type VideoFormAction = (
  prev: VideoFormState,
  formData: FormData
) => Promise<VideoFormState>;

type VideoFormValues = {
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  youtube_channel_id: string;
  thumbnail_url: string;
  published_at: string;
  description: string;
};

type Props = {
  action: VideoFormAction;
  artists: ArtistSummary[];
  combos: ComboSummary[];
  units: UnitSummary[];
  initialValues?: Partial<VideoInput>;
  initialCasts?: CastEntry[];
  submitLabel: string;
};

function toFormValues(initial?: Partial<VideoInput>): VideoFormValues {
  return {
    title: initial?.title ?? "",
    youtube_url: initial?.youtube_url ?? "",
    youtube_video_id: initial?.youtube_video_id ?? "",
    youtube_channel_id: initial?.youtube_channel_id ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
    published_at: initial?.published_at
      ? initial.published_at.slice(0, 16)
      : "",
    description: initial?.description ?? "",
  };
}

export function VideoForm({
  action,
  artists,
  combos,
  units,
  initialValues,
  initialCasts,
  submitLabel,
}: Props) {
  const [state, formAction] = useActionState<VideoFormState, FormData>(
    action,
    {}
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: clientErrors },
    reset,
  } = useForm<VideoFormValues>({
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
    formData.set("youtube_url", data.youtube_url);
    formData.set("youtube_video_id", data.youtube_video_id);
    formData.set("youtube_channel_id", data.youtube_channel_id);
    formData.set("thumbnail_url", data.thumbnail_url);
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
          htmlFor="youtube_url"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          YouTube URL
        </label>
        <input
          id="youtube_url"
          type="url"
          {...register("youtube_url", {
            onBlur: (e) => {
              const extracted = extractYoutubeVideoId(String(e.target.value ?? ""));
              if (extracted) setValue("youtube_video_id", extracted, { shouldDirty: true });
            },
          })}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputWithPlaceholderClass}
        />
        <p className="mt-0.5 text-xs text-brand-brown-light">
          URLを入力すると動画IDが自動抽出されます
        </p>
      </div>

      <div>
        <label
          htmlFor="youtube_video_id"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          YouTube 動画ID
        </label>
        <input
          id="youtube_video_id"
          type="text"
          {...register("youtube_video_id")}
          placeholder="例: dQw4w9WgXcQ"
          className={inputWithPlaceholderClass}
        />
        {fieldErrors?.youtube_video_id && (
          <p className="mt-1 text-xs text-brand-gold" role="alert">
            {fieldErrors.youtube_video_id}
          </p>
        )}
        <p className="mt-0.5 text-xs text-brand-brown-light">
          URLから自動抽出できない場合は直接入力してください
        </p>
      </div>

      <div>
        <label
          htmlFor="youtube_channel_id"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          YouTube チャンネルID
        </label>
        <input
          id="youtube_channel_id"
          type="text"
          {...register("youtube_channel_id")}
          placeholder="例: UCxxxxxxxxxx"
          className={inputWithPlaceholderClass}
        />
      </div>

      <div>
        <label
          htmlFor="thumbnail_url"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          サムネイルURL
        </label>
        <input
          id="thumbnail_url"
          type="url"
          {...register("thumbnail_url")}
          placeholder="https://..."
          className={inputWithPlaceholderClass}
        />
        <p className="mt-0.5 text-xs text-brand-brown-light">
          空欄の場合はYouTube動画IDからサムネイルURLが自動生成されます
        </p>
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
          htmlFor="description"
          className="block text-sm font-medium text-brand-brown-dark"
        >
          説明
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className={inputClass}
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
          className="rounded-md bg-brand-sky px-5 py-2 text-sm font-medium text-brand-cream transition hover:bg-brand-sky-dark disabled:opacity-50"
        >
          {isPending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
